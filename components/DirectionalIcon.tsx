import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Send } from "lucide-react";

type Direction = "left" | "right" | "up-right" | "chevron-left" | "chevron-right" | "send";

const icons = {
  left: ArrowLeft,
  right: ArrowRight,
  "up-right": ArrowUpRight,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  send: Send,
} satisfies Record<Direction, typeof ArrowRight>;

export function DirectionIcon({ direction = "right", size = 16, className }: {
  direction?: Direction;
  size?: number;
  className?: string;
}) {
  const Icon = icons[direction];
  return <Icon aria-hidden="true" className={className} size={size} strokeWidth={2.2} style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle" }} />;
}

export function DirectionLabel({ children, direction = "right", size = 16 }: {
  children: ReactNode;
  direction?: Direction;
  size?: number;
}) {
  return <span className="directional-label" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: ".45em" }}>{children}<DirectionIcon direction={direction} size={size}/></span>;
}
