"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronRight, CircleAlert, Headphones, Mic, RotateCcw, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { DirectionIcon } from "@/components/DirectionalIcon";
import { course, modules, questionBank } from "@/lib/course";
import type { AssessmentItem, ScoreResult as CurrentScoreResult } from "@/lib/types";
// Retained earlier prototype; the active entry is learning-platform.tsx.
type ScoreResult = CurrentScoreResult & { dimensions: Record<string, number> };

type Screen = "home" | "path" | "check" | "assessment" | "video" | "result" | "bank";
type SpeechRecognitionLike = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((event: any) => void) | null; onerror: ((event: any) => void) | null; onend: (() => void) | null };
const levelName = { recall: "识记", understand: "理解", transfer: "迁移" };
const samples: Record<string, string> = {
  P1: "设备输出的是能量，不是功效。能量进入组织后会传播和分布，只有到达目标层次并作用于靶点，才会触发即时或后续组织反应，最终才可能形成效果。",
  P2: "波长会影响传播和不同吸收体的吸收倾向，但效果还要看能量、脉宽、光斑、冷却和组织特性。选择性是多条件匹配，不代表周围组织绝对不受影响。",
  P3: "射频不是把热直接送进去，而是设备和电极建立高频电流回路，组织阻抗让电能在组织内部转化为热，电极结构和参数共同塑造温度场。",
  P4: "超声首先是机械波，传播中会反射、折射、衰减和吸收。聚焦让能量在目标区域相对集中，焦区产生热或机械作用并触发组织反应，标称深度也不等于每个人的绝对层次。",
  P5: "要看能量到哪里、单位区域有多少、释放多快多久、作用范围和温度维持时间。这些共同决定组织反应以及后续效果与风险，所以参数不是越高越好。",
  P6: "不能脱离问题谈哪台设备最强。应先问改什么、到哪里、作用谁、怎么作用、产生什么反应，再判断它独立完成任务还是与其他方式互补。协同也要考虑累计风险。",
};

const videoGuides: Record<string, { duration: string; question: string; topics: Array<[string, string]> }> = {
  P1: { duration: "07:00", question: "设备为什么能改变人体组织？", topics: [["00:40","能量是什么"],["01:35","能量怎样进入组织"],["02:35","层次与靶点"],["03:45","组织如何反应"],["05:20","六环能量链"]] },
  P2: { duration: "14:00", question: "光进入皮肤以后发生了什么？", topics: [["00:50","波长与光的身份"],["02:25","四种光学去向"],["04:10","三类吸收体"],["06:10","选择性光热"],["13:20","光作用五问"]] },
  P3: { duration: "10:00", question: "电为什么能够让组织升温？", topics: [["00:45","射频是什么"],["01:55","阻抗与生热"],["03:20","电极与回路"],["05:10","单极双极多极"],["08:40","射频五问"]] },
  P4: { duration: "10:00", question: "声波为什么能够作用到深层？", topics: [["00:45","机械波"],["01:50","传播与衰减"],["03:35","聚焦原理"],["05:20","焦区反应"],["08:35","超声五问"]] },
  P5: { duration: "11:00", question: "同一种能量为什么效果不一样？", topics: [["00:45","作用层次"],["02:10","强度与时间"],["04:10","作用范围"],["05:50","温度过程"],["08:35","效果与风险"]] },
  P6: { duration: "08:00", question: "不同设备为什么各有用处？", topics: [["00:40","先看问题"],["01:25","再找层次"],["02:10","明确靶点"],["03:00","选择能量"],["05:55","设备六问"]] },
};

export default function AssessmentClient() {
  const [screen, setScreen] = useState<Screen>("home");
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scores, setScores] = useState<Record<string, ScoreResult>>({});
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [micStatus, setMicStatus] = useState<"idle" | "ready" | "blocked">("idle");
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [selectedModuleId, setSelectedModuleId] = useState("P1");
  const [testMode, setTestMode] = useState<"pretest" | "retest">("pretest");
  const [badges, setBadges] = useState<string[]>([]);
  const [guideAnswer, setGuideAnswer] = useState("选择左侧时间点，AI 导览会告诉你这一段解决什么问题。");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);
  const current = items[index];
  const currentModule = current ? modules.find((m) => m.id === current.moduleId)! : modules[0];
  const result = useMemo(() => {
    const values = Object.values(scores);
    const total = values.length ? Math.round(values.reduce((sum, value) => sum + value.total, 0) / values.length) : 0;
    const blockers = values.flatMap((value) => value.blockers);
    const level = blockers.length || total < 80 ? "未达标" : total >= 90 ? "优秀" : "通过";
    return { total, level, blockers };
  }, [scores]);

  useEffect(() => {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));
    if (SpeechRecognition) {
      const recognition: SpeechRecognitionLike = new SpeechRecognition();
      recognition.lang = "zh-CN"; recognition.interimResults = true; recognition.continuous = false;
      recognition.onresult = (event: any) => setAnswer(Array.from(event.results).map((r: any) => r[0].transcript).join(""));
      recognition.onerror = () => { setListening(false); setMicStatus("blocked"); };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN"; utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  }

  async function checkMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop()); setMicStatus("ready");
    } catch { setMicStatus("blocked"); }
  }

  async function startAssessment(moduleId = selectedModuleId, mode: "pretest" | "retest" = testMode) {
    setLoading(true);
    const candidates = questionBank.filter((question) => question.moduleId === moduleId);
    const chosen = mode === "pretest"
      ? [candidates.find((q) => q.level === "recall")!, candidates.find((q) => q.level === "understand")!, candidates.find((q) => q.level === "transfer")!]
      : [candidates.filter((q) => q.level === "understand")[1] || candidates[2], candidates.filter((q) => q.level === "transfer")[1] || candidates[5]];
    setSelectedModuleId(moduleId); setTestMode(mode);
    setItems(chosen); setIndex(0); setScores({}); setElapsed(0); setAnswer(""); setFollowUp(false); setScreen("assessment");
    timerRef.current = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    setLoading(false); setTimeout(() => speak(chosen[0].prompt), 300);
  }

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { setAnswer(""); setListening(true); recognitionRef.current.start(); }
  }

  async function submitAnswer() {
    if (!answer.trim() || !current) return;
    setLoading(true);
    const response = await fetch("/api/assessment/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: current.id, answer }) });
    const score: ScoreResult = await response.json();
    const nextScores = { ...scores, [current.id]: score };
    setScores(nextScores);
    if (score.followUpNeeded && !followUp) {
      setFollowUp(true); setAnswer(""); speak(score.followUp); setLoading(false); return;
    }
    const nextIndex = index + 1;
    setFollowUp(false); setAnswer(""); setLoading(false);
    if (nextIndex >= items.length) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      const values = Object.values(nextScores);
      const average = Math.round(values.reduce((sum, value) => sum + value.total, 0) / values.length);
      const hasBlocker = values.some((value) => value.blockers.length);
      if (average >= 80 && !hasBlocker) setBadges((prev) => Array.from(new Set([...prev, current.moduleId])));
      setScreen("result");
    } else { setIndex(nextIndex); setTimeout(() => speak(items[nextIndex].prompt), 250); }
  }

  async function remediate(moduleId: string) {
    const response = await fetch("/api/assessment/remediate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleId, previousItemId: scores[moduleId]?.itemId }) });
    const data = await response.json() as { item: AssessmentItem };
    setItems([data.item]); setIndex(0); setAnswer(""); setFollowUp(false); setScreen("assessment"); setElapsed(0);
    setTimeout(() => speak(data.item.prompt), 250);
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setScreen("home")}><span className="brand-mark">半</span><span><b>医美军校</b><small>AI 智能陪练</small></span></button>
      <div className="top-meta"><span className="status-dot" />L3 课程测评 · Demo</div>
    </header>
    {screen === "home" && <section className="home-grid page-enter">
      <div className="hero-copy"><div className="eyebrow">L3 · 听懂专业 · AI 测试 04</div><h1>不是考你背了多少，<br/><em>而是能不能把道理讲清楚。</em></h1><p>完成 6 道语音问答，AI 会沿着“能量—组织—效果”的链条追问，找出真正的知识盲点。</p>
        <div className="hero-actions"><button className="primary-btn" onClick={() => setScreen("path")}><Sparkles size={19}/>进入课程学习<ChevronRight size={18}/></button><button className="ghost-btn" onClick={() => setScreen("bank")}><BookOpen size={18}/>查看题库生成</button></div>
        <div className="trust-row"><span><ShieldCheck/>学习陪练，非正式考试</span><span><Headphones/>约 15 分钟</span><span><Sparkles/>6 模块自适应追问</span></div>
      </div>
      <div className="model-card"><div className="model-head"><span>声光电基础</span><b>6 MODULES</b></div><div className="energy-chain">{modules.map((m, i) => <div key={m.id} className="chain-node"><span>{m.id}</span><div><b>{m.title}</b><small>{m.subtitle}</small></div>{i < modules.length - 1 && <i/>}</div>)}</div><div className="model-foot"><span>统一判断主线</span><b className="energy-chain-summary"><span>能量</span><DirectionIcon size={15}/><span>组织</span><DirectionIcon size={15}/><span>反应</span><DirectionIcon size={15}/><span>效果</span></b></div></div>
    </section>}
    {screen === "check" && <section className="center-page page-enter">
      <div className="step-label">{selectedModuleId} · {modules.find((m) => m.id === selectedModuleId)?.title} · {testMode === "pretest" ? "课前测试" : "学习后复测"}</div><h2>先确认你能听见，也能被听见</h2><p className="lead">本轮达标线为 80 分。建议佩戴耳机，在安静环境下完成；转写结果可确认和修正。</p>
      <div className="check-card"><div className="check-visual"><div className={`mic-orb ${micStatus}`}><Mic size={34}/></div><div><b>麦克风权限</b><p>{micStatus === "ready" ? "已连接，可以开始" : micStatus === "blocked" ? "未获得权限，可使用文字输入继续" : "点击检测并授权浏览器使用麦克风"}</p></div></div><button className="secondary-btn" onClick={checkMic}>{micStatus === "ready" ? <><Check size={17}/>重新检测</> : "检测麦克风"}</button></div>
      <div className="check-card"><div className="check-visual"><div className="speaker-orb"><Volume2 size={28}/></div><div><b>语音播报</b><p>AI 将朗读题目和追问，你也可以随时点击重播。</p></div></div><button className="secondary-btn" onClick={() => speak("你好，欢迎参加声光电基础课程测评。")}>试听</button></div>
      {!speechSupported && <div className="notice"><CircleAlert size={18}/>当前浏览器不支持语音识别，将自动使用文字作答。建议使用最新版 Chrome 或 Edge。</div>}
      <button className="primary-btn wide" disabled={loading} onClick={() => startAssessment()}>{loading ? "正在准备题目…" : testMode === "pretest" ? "开始课前测试" : "开始学习后复测"}<ChevronRight size={18}/></button>
    </section>}
    {screen === "assessment" && current && <section className="assessment-layout page-enter">
      <aside className="assessment-side"><div className="side-title"><small>{testMode === "pretest" ? "课前摸底" : "学习后复测"}</small><b>{selectedModuleId} {currentModule.title}</b></div><div className="module-rail">{items.map((item, i) => <div key={item.id} className={`rail-item ${i === index ? "active" : i < index || scores[item.id] ? "done" : ""}`}><span>{scores[item.id] ? <Check size={14}/> : i + 1}</span><div><b>问题 {i + 1}</b><small>{levelName[item.level]}</small></div></div>)}</div><div className="timer"><small>已用时</small><b>{minutes}:{seconds}</b><span>本小节建议 05:00 内完成</span></div></aside>
      <div className="question-stage"><div className="question-top"><div><span className="module-pill">{current.moduleId}</span><span className="level-pill">{levelName[current.level]}</span></div><b>{index + 1} / {items.length}</b></div><div className="teacher-line"><div className="teacher-avatar">AI</div><span>{followUp ? "我想再追问一步" : currentModule.title}</span><button onClick={() => speak(followUp ? current.followUp : current.prompt)} aria-label="重播题目"><Volume2 size={18}/></button></div><h2 className="question-text">{followUp ? current.followUp : current.prompt}</h2>
        <div className={`voice-panel ${listening ? "listening" : ""}`}><button className="record-btn" onClick={toggleListening} disabled={!speechSupported}><Mic size={28}/><span>{listening ? "正在聆听…点击结束" : speechSupported ? "点击开始回答" : "语音不可用"}</span></button><div className="wave" aria-hidden="true">{Array.from({length: 24}).map((_, i) => <i key={i}/>)}</div><div className="transcript-head"><span>实时转写</span><button onClick={() => setAnswer(samples[current.moduleId])}>填入演示答案</button></div><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="语音转写会显示在这里；你也可以直接输入或修正识别结果。" /><div className="answer-actions"><button className="text-btn" onClick={() => setAnswer("")}><RotateCcw size={15}/>重新作答</button><button className="primary-btn" disabled={!answer.trim() || loading} onClick={submitAnswer}>{loading ? "AI 正在分析…" : followUp ? "提交追问回答" : "确认并提交"}<ChevronRight size={17}/></button></div></div><p className="privacy-note"><ShieldCheck size={14}/>音频只用于本次转写；Demo 不保存原始录音。</p>
      </div>
    </section>}
    {screen === "path" && <section className="path-page page-enter">
      <div className="path-hero"><div><div className="eyebrow">因人而异的学习路径</div><h2>会的快速通关，不会的精准补课</h2><p>每个小章节先测后学。达到 80 分即可跳过视频并获得勋章；未达标会标出知识点和视频时间段。</p></div><div className="path-legend"><span><i className="legend-pass"/>80 分快速通关</span><span><i className="legend-learn"/>未达标先学习</span></div></div>
      <div className="module-cards">{modules.map((module, idx) => { const passed = badges.includes(module.id); const guide = videoGuides[module.id]; return <article className={`module-course-card ${passed ? "passed" : ""}`} key={module.id}>
        <div className="course-card-top"><span>{module.id}</span>{passed ? <b className="badge-earned">★ 已获勋章</b> : <em>{guide.duration}</em>}</div><h3>{module.title}</h3><p>{guide.question}</p>
        <div className="knowledge-preview">{module.requiredPoints.slice(0,3).map((point) => <span key={point}>· {point}</span>)}</div>
        <button className={passed ? "secondary-btn" : "primary-btn"} onClick={() => { setSelectedModuleId(module.id); setTestMode("pretest"); setScreen("check"); }}>{passed ? "再次挑战" : idx === 0 ? "开始课前测试" : "先测一测"}<ChevronRight size={16}/></button>
      </article>})}</div>
    </section>}
    {screen === "video" && <section className="video-page page-enter">
      <div className="video-head"><div><div className="eyebrow">{selectedModuleId} · 精准学习</div><h2>{modules.find((m) => m.id === selectedModuleId)?.title}</h2><p>{videoGuides[selectedModuleId].question}</p></div><button className="ghost-btn" onClick={() => setScreen("path")}>返回课程地图</button></div>
      <div className="video-layout"><div className="video-column"><div className="video-mock"><div className="video-glow"/><span className="play-mark">▶</span><div className="video-caption">{selectedModuleId}｜{videoGuides[selectedModuleId].question}</div><div className="video-progress"><i/><b>00:00 / {videoGuides[selectedModuleId].duration}</b></div></div><div className="timestamp-card"><h3>本轮未掌握知识点</h3><p>点击时间点可快速定位，不必从头盲目重看。</p>{videoGuides[selectedModuleId].topics.map(([time, topic]) => <button key={time} onClick={() => setGuideAnswer(`${time} 的“${topic}”解释了本轮测试中的关键缺口。观看时重点听清它如何连接到组织反应与最终结果。`)}><span>{time}</span><b>{topic}</b><ChevronRight size={15}/></button>)}</div></div>
        <aside className="guide-panel"><div className="guide-title"><div className="teacher-avatar">AI</div><div><b>AI 视频导览</b><small>随时问这段在讲什么</small></div></div><div className="guide-summary"><span>本节一句话</span><p>{modules.find((m) => m.id === selectedModuleId)?.conclusion}</p></div><div className="guide-chat"><div className="guide-bubble">{guideAnswer}</div></div><div className="guide-prompts"><button onClick={() => setGuideAnswer(`本节主线是：${modules.find((m) => m.id === selectedModuleId)?.anchor}`)}>这节的主线是什么？</button><button onClick={() => setGuideAnswer(`最容易答错的是：${modules.find((m) => m.id === selectedModuleId)?.misconceptions.join("、")}。`)}>最容易答错什么？</button><button onClick={() => setGuideAnswer(`本节边界：${modules.find((m) => m.id === selectedModuleId)?.boundary}`)}>哪些话不能说？</button></div><button className="primary-btn wide" onClick={() => { setTestMode("retest"); startAssessment(selectedModuleId, "retest"); }}>看完视频，开始复测<ChevronRight size={17}/></button></aside>
      </div>
    </section>}
    {screen === "result" && <section className="result-page page-enter">
      <div className="result-hero"><div><div className="eyebrow">{selectedModuleId} · {testMode === "pretest" ? "课前测试" : "学习后复测"}报告</div><h2>{result.total >= 80 && !result.blockers.length ? "本小节已通关，勋章已点亮。" : "还差一点，先看对应片段再来一次。"}</h2><p>80 分为达标线；关键专业误区会阻断快速通关。</p></div><div className={`score-ring ${result.total < 80 || result.blockers.length ? "warn" : ""}`}><strong>{result.total}</strong><span>/ 100</span><b>{result.total >= 80 && !result.blockers.length ? "达标" : "未达标"}</b></div></div>
      {result.blockers.length > 0 && <div className="blocker-banner"><CircleAlert/><div><b>存在关键误区，暂时不能通关</b><p>{result.blockers.join("；")}</p></div></div>}
      <div className="result-grid"><div className="card"><h3>本题考察知识点</h3>{Array.from(new Set(Object.values(scores).flatMap((score) => [...score.hitPoints, ...score.missingPoints]))).map((point, idx) => <div className="knowledge-result" key={point}><span>{String(idx + 1).padStart(2,"0")}</span><b>{point}</b><small>{videoGuides[selectedModuleId].topics[idx % videoGuides[selectedModuleId].topics.length][0]}</small></div>)}</div><div className="card"><h3>四维能力画像</h3>{["concept","causality","clarity","boundary"].map((k) => { const labels:any={concept:"概念准确性",causality:"因果完整性",clarity:"表达可听懂",boundary:"边界与风险"}; const max:any={concept:40,causality:25,clarity:20,boundary:15}; const avg=Math.round(Object.values(scores).reduce((a,s)=>a+(s.dimensions as any)[k],0)/Math.max(Object.keys(scores).length,1)); return <div className="dimension" key={k}><span>{labels[k]}</span><div><i style={{width:`${avg/max[k]*100}%`}}/></div><b>{avg}/{max[k]}</b></div>})}</div></div>
      <div className="card gaps"><h3>{result.total >= 80 && !result.blockers.length ? "获得小章节勋章" : "建议学习路径"}</h3>{result.total >= 80 && !result.blockers.length ? <div className="medal-award"><span>★</span><div><b>{selectedModuleId} {modules.find((m) => m.id === selectedModuleId)?.title}</b><p>你已掌握本小节专业知识，可快速进入下一节。</p></div></div> : videoGuides[selectedModuleId].topics.slice(0,3).map(([time, topic]) => <div className="gap-row" key={time}><div className="gap-code">{time}</div><div><b>{topic}</b><p>结合测试反馈重点观看此片段。</p></div></div>)}</div>
      <div className="result-actions"><button className="ghost-btn" onClick={() => setScreen("path")}>返回课程地图</button>{result.total >= 80 && !result.blockers.length ? <button className="primary-btn" onClick={() => setScreen("path")}>领取勋章并继续<ChevronRight size={17}/></button> : <button className="primary-btn" onClick={() => setScreen("video")}><BookOpen size={17}/>观看对应视频片段</button>}</div>
    </section>}
    {screen === "bank" && <section className="bank-page page-enter"><div className="bank-head"><div><div className="eyebrow">脚本导入 · 题库生成预览</div><h2>36 道题，每一道都能回到原课程</h2><p>每模块 6 道，覆盖识记、理解、迁移三层能力。</p></div><button className="ghost-btn" onClick={() => setScreen("home")}>返回首页</button></div><div className="bank-stats"><div><b>6</b><span>课程模块</span></div><div><b>36</b><span>已审核主问题</span></div><div><b>3</b><span>能力层级</span></div><div><b>100%</b><span>可追溯脚本</span></div></div><div className="bank-list">{modules.map((m) => <article className="bank-module" key={m.id}><header><span>{m.id}</span><div><b>{m.title}</b><small>{m.anchor}</small></div><em>{questionBank.filter((q)=>q.moduleId===m.id).length} 题</em></header><div className="bank-questions">{questionBank.filter((q)=>q.moduleId===m.id).map((q) => <div key={q.id}><span className={`q-level ${q.level}`}>{levelName[q.level]}</span><p>{q.prompt}</p><small>{q.reference}</small></div>)}</div></article>)}</div></section>}
    <footer><span>{course.disclaimer}</span><span>课程版本 {course.version}</span></footer>
  </main>;
}
