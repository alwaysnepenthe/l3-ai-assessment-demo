"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { DirectionLabel } from "@/components/DirectionalIcon";
import "./floating-companion.css";

type Position = { x: number; y: number };
const POSITION_KEY = "half-island-companion-position-v1";
const SIZE = 86;
const GAP = 12;

function constrain(position: Position): Position {
  return {
    x: Math.max(GAP, Math.min(position.x, window.innerWidth - SIZE - GAP)),
    y: Math.max(GAP, Math.min(position.y, window.innerHeight - SIZE - GAP)),
  };
}

export default function FloatingCompanion({ name, view, open, onOpen, children }: {
  name: string;
  view: string;
  open: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  const [position, setPosition] = useState<Position | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [dragging, setDragging] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const currentPosition = useRef<Position | null>(null);
  const moved = useRef(false);
  const drag = useRef<{ pointerId: number; start: Position; origin: Position; handle: Element } | null>(null);

  useEffect(() => {
    function resize() {
      let saved = currentPosition.current;
      if (!saved) {
        try {
          const candidate = JSON.parse(localStorage.getItem(POSITION_KEY) || "null");
          if (candidate && Number.isFinite(candidate.x) && Number.isFinite(candidate.y)) saved = candidate;
        } catch { /* Use the default corner if local storage is unavailable. */ }
      }
      const next = constrain(saved || { x: 24, y: window.innerHeight - SIZE - 22 });
      currentPosition.current = next;
      setPosition(next);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }
    const frame = requestAnimationFrame(resize);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, []);

  function remember(next: Position) {
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(next)); } catch { /* Dragging remains available without storage. */ }
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const target = event.target as Element;
    const handle = target.closest("[data-companion-drag], .lp-pet-panel>header");
    if (!handle || target.closest("button, input, textarea, a") && !target.closest(".companion-avatar")) return;
    const bounds = root.current?.getBoundingClientRect();
    if (!bounds) return;
    moved.current = false;
    drag.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { x: bounds.left, y: bounds.top }, handle };
    handle.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.start.x, dy = event.clientY - active.start.y;
    if (!moved.current && Math.hypot(dx, dy) < 5) return;
    moved.current = true;
    setDragging(true);
    const next = constrain({ x: active.origin.x + dx, y: active.origin.y + dy });
    currentPosition.current = next;
    setPosition(next);
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (active.handle.hasPointerCapture(event.pointerId)) active.handle.releasePointerCapture(event.pointerId);
    if (moved.current && currentPosition.current) remember(currentPosition.current);
    drag.current = null;
    setDragging(false);
  }

  const bubbleWidth = Math.min(285, viewport.width ? viewport.width - GAP * 2 : 285);
  const panelWidth = Math.min(380, viewport.width ? viewport.width - GAP * 2 : 380);
  const panelHeight = Math.min(540, Math.max(180, viewport.height - SIZE - GAP * 3));
  const bubbleLeft = position ? Math.min(0, viewport.width - GAP - position.x - bubbleWidth) : 0;
  const panelLeft = position ? Math.min(0, viewport.width - GAP - position.x - panelWidth) : 0;
  const panelTop = position ? Math.max(GAP, Math.min(position.y - panelHeight - GAP, viewport.height - panelHeight - GAP)) - position.y : -panelHeight - GAP;
  const style = {
    ...(position ? { left: position.x, top: position.y, bottom: "auto" } : {}),
    "--companion-bubble-left": `${bubbleLeft}px`,
    "--companion-tail-left": `${32 - bubbleLeft}px`,
    "--companion-panel-left": `${panelLeft}px`,
    "--companion-panel-top": `${panelTop}px`,
    "--companion-panel-height": `${panelHeight}px`,
  } as CSSProperties;
  const message = view === "test" ? "别紧张，按自己的理解说就好。完成后我会陪你一起梳理要点。"
    : view === "lesson" ? "看视频时有疑问随时叫我，看完我们再一起复测。"
    : view === "personal" ? "挑一个想提升的点，我们可以一起练练。"
    : "今天想先挑战一节，还是有课程问题想和我聊聊？";

  return <div ref={root} className={`lp-companion ${dragging ? "is-dragging" : ""} ${position && position.y < 205 ? "bubble-below" : ""}`} style={style}
    onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
    {!open && bubbleVisible && <div className="companion-speech" data-companion-drag="true">
      <button className="companion-bubble-close" onClick={() => setBubbleVisible(false)} aria-label="关闭半小岛说话气泡" title="关闭气泡">×</button>
      <b>{name}你好呀，我是半小岛！</b><p>{message}</p>
      <button className="lp-primary" onClick={onOpen}><DirectionLabel>和我聊聊</DirectionLabel></button>
    </div>}
    {open && children}
    <button className="lp-pet-avatar companion-avatar" data-companion-drag="true" aria-label={open ? "半小岛，拖动可调整位置" : "打开半小岛，拖动可调整位置"} title="点击聊天 · 拖动调整位置"
      onClick={event => { if (event.detail !== 0 && moved.current) { moved.current = false; return; } onOpen(); }}
      onKeyDown={event => {
        if (!event.altKey || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const bounds = root.current?.getBoundingClientRect();
        if (!bounds) return;
        const next = constrain({ x: bounds.left + (event.key === "ArrowLeft" ? -20 : event.key === "ArrowRight" ? 20 : 0), y: bounds.top + (event.key === "ArrowUp" ? -20 : event.key === "ArrowDown" ? 20 : 0) });
        currentPosition.current = next; setPosition(next); remember(next);
      }}>
      <img src="/assets/peninsula-companion.webp" alt="半小岛" draggable={false}/><i>AI</i>
    </button>
  </div>;
}
