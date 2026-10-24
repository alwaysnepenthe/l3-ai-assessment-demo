"use client";
import { useEffect, useRef, useState } from "react";
import { modules, questionBank, selectAssessment } from "@/lib/course";
import { summarize, getPreTestDiagnosis } from "@/lib/scoring";
import type { AssessmentItem, ScoreResult } from "@/lib/types";
import PersonalHome from "@/components/PersonalHome";
import "./learning.css";
import "./learning-platform-extras.css";

type View = "overview" | "lesson" | "test" | "celebration" | "report" | "personal";
type Message = { role: "user" | "assistant"; content: string };
type RecentAttempt = { moduleId:string; moduleTitle:string; question:string; answer:string; score:number; hitPoints:string[]; missingPoints:string[]; blockers:string[]; createdAt:string };
const courses = ["行业与职业认知", "皮肤基础与需求洞察", "声光电基础", "产品与项目知识", "客户沟通与咨询", "销售实战与异议处理", "合规与长期经营"];
const stageMeta:Record<string,{title:string;kicker:string;icon:string}>={P1:{title:"破译能量链",kicker:"看懂设备改变组织的底层逻辑",icon:"⚡"},P2:{title:"追踪光的旅程",kicker:"跟随一束光进入皮肤",icon:"◉"},P3:{title:"破解射频升温",kicker:"找出电能变成热的关键机关",icon:"⌁"},P4:{title:"锁定深层焦区",kicker:"探索看不见的机械波路径",icon:"◎"},P5:{title:"调控能量地图",kicker:"掌握参数与组织反应的平衡",icon:"⌘"},P6:{title:"设备策略终局",kicker:"用六问建立设备判断框架",icon:"◇"}};
const videos:Record<string,string>={P1:"/videos/l3-p1.mp4",P2:"/videos/l3-p2.mp4",P3:"/videos/l3-p3.mp4",P5:"/videos/l3-p5.mp4"};
const videoNodes:Record<string,Array<[number,string]>>={P1:[[.08,"能量是什么"],[.25,"能量传播与分布"],[.43,"目标层次与靶点"],[.64,"即时与后续反应"],[.84,"六环能量链"]],P2:[[.08,"光进入皮肤后的去向"],[.28,"波长与传播"],[.48,"组织吸收体"],[.69,"选择性光热作用"],[.88,"光作用五问"]],P3:[[.08,"射频设备与电极"],[.27,"电流回路"],[.48,"组织阻抗与生热"],[.68,"温度场形成"],[.88,"射频五问与组织反应"]],P4:[[.08,"超声作为机械波传播"],[.28,"传播中的反射与衰减"],[.5,"聚焦与能量集中"],[.7,"焦区组织反应"],[.88,"标称深度与个体差异"]],P5:[[.06,"参数与组织反应"],[.22,"作用层次与强度"],[.42,"时间和能量分布"],[.62,"范围与温度"],[.82,"效果与风险"]],P6:[[.08,"从诉求识别问题"],[.28,"判断问题层次与靶组织"],[.5,"匹配能量与组织反应"],[.7,"设备核心任务"],[.88,"设备协同与风险边界"]]};
const time = (s:number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}`;
function locateVideoNode(moduleId:string, point:string){
 const nodes=videoNodes[moduleId]||[];
 const required=modules.find(m=>m.id===moduleId)?.requiredPoints||[];
 const index=required.findIndex(p=>p===point);
 if(!nodes.length)return undefined;
 const nodeIndex=index<0?0:Math.min(nodes.length-1,Math.floor(index*nodes.length/Math.max(1,required.length)));
 return nodes[nodeIndex];
}

export default function LearningPlatform(){
 const [collapsed,collapse]=useState(false),[level,setLevel]=useState(3),[view,setView]=useState<View>("overview"),[mid,setMid]=useState("P1");
 const [badges,setBadges]=useState<string[]>([]),[watched,setWatched]=useState<string[]>([]),[required,setRequired]=useState<string[]>([]);
 const [messages,setMessages]=useState<Message[]>([]),[input,setInput]=useState(""),[chatBusy,setChatBusy]=useState(false),[modelMode,setModelMode]=useState("");
 const [items,setItems]=useState<AssessmentItem[]>([]),[qi,setQi]=useState(0),[answer,setAnswer]=useState(""),[scores,setScores]=useState<ScoreResult[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[listening,setListening]=useState(false),[voiceSupported,setVoiceSupported]=useState(false);
 const [testMode,setTestMode]=useState<"pre"|"post"|"final">("pre"),[videoDuration,setVideoDuration]=useState(0),[pendingSeek,setPendingSeek]=useState(0);
 const [canSkipChapter,setCanSkipChapter]=useState(false),[diagnosis,setDiagnosis]=useState<string[]>([]),[progressSummary,setProgressSummary]=useState("");
 const [profile,setProfile]=useState<{name:string;role:string;registrationInfo?:{specialization?:string}}|null>(null);
 const [assistantOpen,setAssistantOpen]=useState(false),[petVisible,setPetVisible]=useState(false),[welcomeOpen,setWelcomeOpen]=useState(false),[guide,setGuide]=useState(""),[guideLoading,setGuideLoading]=useState(false);
 const [recentAttempts,setRecentAttempts]=useState<RecentAttempt[]>([]);
 const [lessonGuide,setLessonGuide]=useState<Record<string,string>>({});
 const video=useRef<HTMLVideoElement>(null),speech=useRef<any>(null),chatEnd=useRef<HTMLDivElement>(null);
 const item=items[qi],mod=modules.find(m=>m.id===(testMode==="final"&&item?item.moduleId:mid))!;
 const chapterBadges=badges.filter(id=>/^P[1-6]$/.test(id)),allChaptersDone=modules.every(m=>badges.includes(m.id));
 const summary=scores.length?summarize(scores):null;
 const total=summary?.total||0;
 const blockers=scores.flatMap(s=>s.blockers);
 const passed=testMode==="pre"?canSkipChapter:Boolean(summary&&total>=80&&!blockers.length);
 const userId="demo-user";

 useEffect(()=>{
   try{setBadges(JSON.parse(localStorage.getItem("l3-badges-v2")||"[]"));setWatched(JSON.parse(localStorage.getItem("l3-watched-v2")||"[]"));setRecentAttempts(JSON.parse(localStorage.getItem("l3-short-memory-v1")||"[]"));}catch{}
   if(!localStorage.getItem("half-island-welcome-v1")){setWelcomeOpen(true);setPetVisible(true);}
   const w=window as any;setVoiceSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));

   fetch(`/api/user/profile?userId=${userId}`).then(r=>r.json() as Promise<{progressSummary?:string;profile?:{name:string;role:string;registrationInfo?:{specialization?:string}}}>).then(data=>{
     if(data.progressSummary) setProgressSummary(data.progressSummary);
     if(data.profile) setProfile(data.profile);
   }).catch(()=>{});

   const dayKey=`l3-ai-guide-${new Date().toLocaleDateString("en-CA")}`;
   const savedGuide=localStorage.getItem(dayKey);
   if(savedGuide) setGuide(savedGuide);
   else {
     setGuideLoading(true);
     fetch("/api/user/daily-guide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,courseId:"L3-SG-01",moduleId:"P1",recentAttempts:JSON.parse(localStorage.getItem("l3-short-memory-v1")||"[]")})})
       .then(r=>r.json() as Promise<{guide?:string}>).then(data=>{if(data.guide){setGuide(data.guide);localStorage.setItem(dayKey,data.guide);}})
       .catch(()=>setGuide("今天可以先用 5 分钟复习 P1 的六环能量链，再选择一个还不熟悉的小节开始课前测试。"))
       .finally(()=>setGuideLoading(false));
   }

   return()=>speech.current?.stop();
 },[]);

 useEffect(()=>{chatEnd.current?.scrollIntoView({block:"nearest"});},[messages,chatBusy]);
 useEffect(()=>{if(assistantOpen&&messages.length===0)setMessages([{role:"assistant",content:`${profile?.name||"同学"}你好呀，我是半小岛。可以问我 L3 课程里的概念、机制和视频内容，我会结合你的学习进度陪你一起梳理。`}]);},[assistantOpen,messages.length,profile?.name]);

 function award(id:string){setBadges(prev=>{const next=Array.from(new Set([...prev,id]));localStorage.setItem("l3-badges-v2",JSON.stringify(next));return next;});}
 function markWatched(){setWatched(prev=>{const next=Array.from(new Set([...prev,mid]));localStorage.setItem("l3-watched-v2",JSON.stringify(next));return next;});}
 function selectLevel(n:number){speech.current?.stop();setListening(false);setLevel(n);setView("overview");setError("");}
 function lesson(id:string,seek=0){
   speech.current?.stop();setListening(false);setTestMode("pre");setMid(id);setVideoDuration(0);setPendingSeek(seek);setView("lesson");setError("");
   const m=modules.find(m=>m.id===id);
   setMessages([{role:"assistant",content:`${profile?.name||"同学"}你好呀，欢迎来到 ${id}「${m?.title}」。我是半小岛，已经准备好陪你学习啦。\n\n这节课我们要解决：${m?.objective}\n\n有问题随时问我。`}]);
   if(!lessonGuide[id]){
     const fallback=`本节围绕“${m?.objective}”展开。记住主线：${m?.anchor}。看视频时重点关注这条因果链怎样从能量传递走到组织反应；不要把设备、参数或标称深度直接等同于效果。`;
     setLessonGuide(prev=>({...prev,[id]:fallback}));
     fetch("/api/course-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({moduleId:id,question:`请根据本节课程资料，用一段约80字的口语化导览总结核心信息和学习主线。只总结，不要反问，不给医疗建议。`,history:[],userId,recentAttempts})}).then(r=>r.json() as Promise<{answer?:string;mode?:string}>).then(data=>{if(data.answer)setLessonGuide(prev=>({...prev,[id]:data.answer!}));if(data.mode)setModelMode(data.mode);}).catch(()=>{});
   }
 }
 function startTest(id:string,mode:"pre"|"post"="pre"){
   if(mode==="pre"&&required.includes(id)&&!watched.includes(id)){lesson(id);return;}
   if(mode==="post"&&!watched.includes(id)){lesson(id);return;}
   const pool=questionBank.filter(q=>q.moduleId===id);
   const offset=mode==="post"?1:0;
   setItems((["recall","understand","transfer"] as const).map(l=>pool.filter(q=>q.level===l)[offset]));
   setMid(id);setTestMode(mode);setQi(0);setScores([]);setAnswer("");setError("");setCanSkipChapter(false);setDiagnosis([]);setView("test");
 }
 function startFinalTest(){setItems(selectAssessment());setTestMode("final");setQi(0);setScores([]);setAnswer("");setError("");setCanSkipChapter(false);setDiagnosis([]);setView("test");}
 async function ask(question=input){
   if(!question.trim()||chatBusy)return;
   setMessages(prev=>[...prev,{role:"user",content:question}]);
   setInput("");setChatBusy(true);
   try{
     const r=await fetch("/api/course-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({moduleId:mid,question,history:messages,userId,recentAttempts})});
     const data=await r.json() as {error?:string;mode:string;answer:string};
     if(!r.ok)throw new Error(data.error||"请求失败");
     setModelMode(data.mode);
     setMessages(prev=>[...prev,{role:"assistant",content:data.answer}]);
   }catch{
     setMessages(prev=>[...prev,{role:"assistant",content:"暂时连接不上助教，请稍后重试。"}]);
   }finally{setChatBusy(false);}
 }
 async function submit(){
   if(!answer.trim()||busy)return;
   speech.current?.stop();setListening(false);setBusy(true);setError("");
   try{
     const r=await fetch("/api/assessment/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId:item.id,answer})});
     if(!r.ok)throw new Error();
     const s=await r.json() as ScoreResult;
     setModelMode(s.mode);
     const next=[...scores,s];
     setScores(next);
     const attempt:RecentAttempt={moduleId:item.moduleId,moduleTitle:mod.title,question:item.prompt,answer,score:s.total,hitPoints:s.hitPoints,missingPoints:s.missingPoints,blockers:s.blockers,createdAt:new Date().toISOString()};
     const allAttempts=[...recentAttempts,attempt].slice(-40);
     setRecentAttempts(allAttempts);
     localStorage.setItem("l3-short-memory-v1",JSON.stringify(allAttempts));

     fetch("/api/assessment/record-response",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,courseId:item.moduleId,questionId:item.id,userAnswer:answer,score:s.total,timeSpent:30,misconception:s.blockers[0]})}).then(r=>r.json() as Promise<{diagnosis?:{misconceptionPatterns:string[]}}>).then(data=>{
       if(data.diagnosis?.misconceptionPatterns) setDiagnosis(data.diagnosis.misconceptionPatterns);
     }).catch(()=>{});

     if(qi<items.length-1){setQi(qi+1);setAnswer("");}else{
       const summary=summarize(next);
       const preTestResult=testMode==="pre"?getPreTestDiagnosis(next):null;
       const canSkip=preTestResult?.allPassed||false;
       setCanSkipChapter(canSkip);
       setDiagnosis(testMode==="final"?(summary.total>=80&&!summary.blockers.length?["六大模块综合知识已达到通关标准"]:["总章节考核需达到 80 分，且不能出现关键误区"]):(preTestResult?.diagnosis||[]));
       if(testMode==="final"&&summary.total>=80&&!summary.blockers.length){award("L3-final");}
       const earned=(testMode==="pre"&&canSkip)||(testMode==="post"&&summary.total>=80&&!summary.blockers.length);
       if(testMode==="pre"&&canSkip){award(mid);}
       else if(testMode==="pre"){setRequired(prev=>Array.from(new Set([...prev,mid])));}
       else if(testMode==="post"&&summary.total>=80&&!summary.blockers.length){award(mid);}
       const completedModules=new Set([...badges,...(earned?[mid]:[])]);
       if(modules.every(m=>completedModules.has(m.id))){
         const courseAttempts=allAttempts.filter(a=>modules.some(m=>m.id===a.moduleId));
         const masteredPoints=Array.from(new Set(courseAttempts.flatMap(a=>a.hitPoints)));
         const strugglingPoints=Array.from(new Set(courseAttempts.flatMap(a=>[...a.missingPoints,...a.blockers])));
         const suggestions=Array.from(new Set(courseAttempts.filter(a=>a.score<80).map(a=>`回看 ${a.moduleId}「${a.moduleTitle}」，重练：${a.missingPoints.join("、")||a.blockers.join("、")||"本节核心要点"}`))).slice(0,5);
         fetch("/api/user/memory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,courseId:"L3-SG-01",title:"L3 声光电基础",scores:courseAttempts.map(a=>a.score),masteredPoints,strugglingPoints,suggestions})}).then(r=>r.json() as Promise<{progressSummary?:string}>).then(data=>{if(data.progressSummary)setProgressSummary(data.progressSummary);}).catch(()=>{});
       }
       setView("celebration");
     }
   }catch{setError("暂时无法完成分析，请稍后重试；你的回答已保留。");}finally{setBusy(false);}
 }
 function dictate(){
   if(listening){speech.current?.stop();return;}
   const w=window as any,R=w.SpeechRecognition||w.webkitSpeechRecognition;
   if(!R)return;
   const r=new R();r.lang="zh-CN";r.interimResults=true;
   r.onresult=(e:any)=>setAnswer(Array.from(e.results).map((x:any)=>x[0].transcript).join(""));
   r.onend=()=>setListening(false);
   r.onerror=()=>{setListening(false);setError("语音识别未完成");};
   speech.current=r;setListening(true);
   try{r.start();}catch{setListening(false);}
 }
 function seek(s:number){if(video.current){video.current.currentTime=s;video.current.play().catch(()=>{});}}

 return <div className={`lp lp-pro ${collapsed?"lp-collapsed":""}`}>
  <aside className="lp-sidebar">
    <div className="lp-brand"><span>半</span>{!collapsed&&<div><b>半岛黄埔军校</b><small>销售专业学习中心</small></div>}<button onClick={()=>collapse(!collapsed)}>{collapsed?"☰":"‹"}</button></div>
    <div className="lp-user-mini"><img src="/assets/peninsula-companion.webp" alt="半小岛"/>{!collapsed&&<div><b>{profile?.name||"盛思婕"}</b><small>{badges.includes("L3-final")?"声光电通关者":chapterBadges.length?"能量探索者":"知识新兵"} · {chapterBadges.length}/6 关</small></div>}</div>
    <button className={`lp-home-nav ${view==="personal"?"active":""}`} onClick={()=>setView("personal")}><span>⌂</span> {!collapsed&&"成长主页"}</button>
    <button className={`lp-home-nav ${view!=="personal"?"active":""}`} onClick={()=>{setLevel(3);setView("overview")} }><span>▦</span> {!collapsed&&"课程闯关"}</button>
    {!collapsed&&<p className="lp-nav-label">学习路径</p>}
    <nav>{courses.map((name,i)=><div key={name}><button className={level===i+1?"selected":""} onClick={()=>selectLevel(i+1)}><span>L{i+1}</span>{!collapsed&&<div><b>{name}</b></div>}</button></div>)}</nav>
    {!collapsed&&<div className="lp-sidebar-progress"><div><span>本课程进度</span><b>{Math.round(chapterBadges.length/6*100)}%</b></div><i><em style={{width:`${chapterBadges.length/6*100}%`}}/></i></div>}
  </aside>
  <div className="lp-main">
    <header className="lp-topbar"><div><small>半岛医疗 / 专业成长计划</small><b>{view==="personal"?"我的成长主页":`L${level} · ${courses[level-1]}`}</b></div><div className="lp-top-actions"><span>🔥 连续学习 1 天</span>{view!=="lesson"&&<button onClick={()=>{setPetVisible(true);setAssistantOpen(true);}}>✦ 呼叫半小岛</button>}</div></header>
    {view==="personal"?<section className="lp-content"><div className="lp-section-title"><div><small>MY LEARNING SPACE</small><h2>早上好，{profile?.name||"学员"}</h2></div><p>你的私人助教正在持续了解你的学习进度</p></div><PersonalHome userId={userId} onOpenAssistant={()=>setAssistantOpen(true)}/><button className="lp-primary" onClick={()=>{setLevel(3);setView("overview")}}>进入课程学习 →</button></section>:level!==3?<section className="lp-placeholder"><div>◇</div><small>L{level} · PREPARING</small><h1>{courses[level-1]}</h1><p>该阶段将统一采用“小节课前挑战 → 视频学习 → 复测夺章 → L{level} 总章节语音考核”的闯关结构。课程内容和题库正在建设中。</p><div className="lp-placeholder-final"><span>🏆</span><div><b>L{level} 总章节语音考核</b><small>完成本阶段全部小节后解锁 · 80 分通关</small></div><button disabled>待课程开放</button></div><button className="lp-primary" onClick={()=>selectLevel(3)}>先体验 L3 完整流程 →</button></section>:<>
    {view==="overview"&&<section className="lp-content" id="course-center">
      <div className="lp-hero-pro"><div className="lp-hero-copy"><span className="lp-kicker">L3 · 声光电基础冒险</span><h1>看懂能量，<br/><em>赢下专业表达。</em></h1><p>用六个关卡拆解光、射频、超声与参数逻辑。课前先挑战，80 分直接拿章；未达标就精准看课再战。</p><div className="lp-hero-actions"><button className="lp-primary" onClick={()=>startTest(modules.find(m=>!badges.includes(m.id))?.id||"P1")}>继续闯关 →</button><button className="lp-secondary" onClick={()=>setView("personal")}>查看成长档案</button></div></div><div className="lp-hero-mascot"><div className="lp-orbit"><span>{chapterBadges.length}/6</span><small>章节勋章</small></div><img src="/assets/peninsula-companion.webp" alt="半岛大超炮学习助手"/><div className="lp-mascot-quote">“今天，再拿下一关！”</div></div></div>
      <div className="lp-overview-strip"><div><small>当前称号</small><b>{badges.includes("L3-final")?"声光电通关者":chapterBadges.length>=4?"能量进阶者":chapterBadges.length?"能量探索者":"知识新兵"}</b></div><div><small>课程完成度</small><b>{Math.round(chapterBadges.length/6*100)}%</b></div><div><small>终局考核</small><b>{badges.includes("L3-final")?"已通关":"80 分解锁"}</b></div><div><small>AI 学习模式</small><b>实时陪练</b></div></div>
      <div className="lp-section-title"><div><small>CHALLENGE MAP</small><h2>六关能力地图</h2></div><p>课前挑战 → 精准学习 → 复测夺章</p></div>
      <div className="lp-challenge-grid">{modules.map((m,i)=>{const done=badges.includes(m.id),videoReady=Boolean(videos[m.id]);return <article className={done?"done":""} key={m.id}><div className="lp-stage-top"><span className="lp-stage-no">0{i+1}</span><span className="lp-stage-icon">{stageMeta[m.id].icon}</span><span className={`lp-stage-status ${done?"done":""}`}>{done?"🎖 已夺章":"待挑战"}</span></div><small>{m.id} · 第 {i+1} 关</small><h3>{stageMeta[m.id].title}</h3><p>{stageMeta[m.id].kicker}</p><div className="lp-stage-tags"><span>{videoReady?"▶ 真实课程视频":"视频制作中"}</span><span>3 道挑战题</span></div><div className="lp-stage-actions"><button className="lp-primary" onClick={()=>startTest(m.id)}>{done?"再次挑战":"课前挑战"}</button><button className="lp-text" onClick={()=>lesson(m.id)}>进入课堂 →</button></div>{done&&<div className="lp-medal-mini">🎖</div>}</article>})}</div>
      <section className={`lp-final-gate ${allChaptersDone?"unlocked":"locked"}`}><div className="lp-final-mark">🏆</div><div><small>L3 FINAL CHALLENGE</small><h2>声光电终局考核</h2><p>{allChaptersDone?"六大模块随机抽题，全程支持语音作答。达到 80 分即可获得课程总勋章。":`完成六个小节即可解锁。当前已获得 ${chapterBadges.length}/6 枚章节勋章。`}</p></div><button className="lp-primary" disabled={!allChaptersDone} onClick={startFinalTest}>{badges.includes("L3-final")?"重温终局挑战":"开启总章节语音考核 →"}</button></section>
    </section>}
    {view==="lesson"&&<section className="lp-content">
      <div className="lp-breadcrumb"><button onClick={()=>setView("overview")}>L3 闯关地图</button><span>/</span><b>{mid} {stageMeta[mid].title}</b></div>
      <div className="lp-lesson-heading"><div><span className="lp-kicker">STAGE {mid.slice(1).padStart(2,"0")}</span><h1>{stageMeta[mid].title}</h1><p>{mod.objective}</p></div><button className="lp-primary lp-posttest-cta" disabled={!videos[mid]||!watched.includes(mid)} onClick={()=>startTest(mid,"post")}>{watched.includes(mid)?"开始课后测试 →":videos[mid]?"观看视频后参加课后测试":"视频上线后参加课后测试"}</button></div>
      <div className="lp-workspace">
        <div><div className="lp-player">{videos[mid]?<video key={mid} ref={video} controls preload="metadata" src={videos[mid]} onLoadedMetadata={e=>{const duration=e.currentTarget.duration;setVideoDuration(duration);if(pendingSeek>0){e.currentTarget.currentTime=duration*pendingSeek;e.currentTarget.play().catch(()=>{});setPendingSeek(0);}}} onEnded={markWatched}/>:<div className="lp-video-empty"><span>{stageMeta[mid].icon}</span><small>COMING SOON</small><h3>{mid} 课程视频制作中</h3><p>知识导览与 AI 助教仍可使用，视频上线后会在这里呈现。</p></div>}</div><div className="lp-video-meta"><div><b>{mid} · {mod.title}</b><span>{videoDuration?time(videoDuration):videos[mid]?"正在读取课程时长":"视频待上线"}</span></div><button className="lp-secondary" disabled={!videos[mid]||!watched.includes(mid)}>{watched.includes(mid)?"✓ 已完整观看":videos[mid]?"播放至片尾后解锁复测":"视频待上线"}</button></div><article className="lp-card lp-ai-guide"><div><span>✦ AI 课程导览</span><small>{modelMode==="ai"?"结合本节脚本生成":"课程导览"}</small></div><p>{lessonGuide[mid]||"正在整理本节学习主线…"}</p></article><div className="lp-card lp-chapters lp-video-nodes"><h3>关键节点快速定位</h3><p>{videos[mid]?"按视频时长生成的初始定位点，后续可用精确字幕时间校准。":"本节视频待上线；下列节点是课程重点，暂不可跳转。"}</p>{(videoNodes[mid]||[]).map(([ratio,label])=><button key={label} disabled={!videos[mid]} onClick={()=>seek(videoDuration*ratio)}><time>{videoDuration&&videos[mid]?time(videoDuration*ratio):"—"}</time><span>{label}</span><i>{videos[mid]?"跳转 ▷":"待上线"}</i></button>)}</div></div>
        <aside className="lp-tutor">
          <div className="lp-tutor-heading"><img src="/assets/peninsula-companion.webp" alt="半小岛"/><div><b>半小岛 · AI 视频助教</b><small>{modelMode==="ai"?"真实模型在线":"依据本节资料答疑"}</small></div></div>
          <div className="lp-prompt-buttons">{["三句话总结本关","本关最容易错什么？","给我一个通俗比喻"].map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div>
          <div className="lp-chat">{messages.map((m,i)=><div key={i} className={m.role}><p>{m.content}</p></div>)}{chatBusy&&<div className="assistant"><p>正在思考…</p></div>}<div ref={chatEnd}/></div>
          <form onSubmit={e=>{e.preventDefault();ask();}}><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="对视频内容有疑问？直接问我…"/><button className="lp-primary" disabled={chatBusy||!input.trim()}>发送 ↑</button></form><small className="lp-tutor-note">仅依据课程资料回答 · 不提供个体治疗建议</small>
        </aside>
      </div>
    </section>}
    {view==="test"&&item&&<section className="lp-content lp-exam">
      <button className="lp-text lp-back" onClick={()=>setView("overview")}>‹ 退出本次挑战</button>
      <div className="lp-exam-top"><div><span className="lp-kicker">{testMode==="final"?"L3 FINAL BATTLE":`${item.moduleId} · ${testMode==="pre"?"课前挑战":"学习复测"}`}</span><h1>{testMode==="final"?"声光电终局语音考核":stageMeta[item.moduleId].title}</h1><p>{testMode==="final"?"六个模块各一道综合题，80 分且无关键误区即可获得总勋章。":"回答三个问题，检验你是否真正掌握本关核心。"}</p></div><div className="lp-exam-progress"><b>{qi+1}</b><span>/ {items.length}</span></div></div>
      <div className="lp-exam-layout">
        <aside><img src="/assets/peninsula-companion.webp" alt="考核陪伴助手"/><h2>{listening?"我在认真听…":"准备好了吗？"}</h2><p>{listening?"说完后点击结束录音，你仍可以修改识别文字。":"建议用自己的话讲清楚逻辑，不必背标准答案。"}</p><div className="lp-test-steps">{items.map((q,i)=><span className={i===qi?"active":i<qi?"done":""} key={q.id}>{i<qi?"✓":i+1}</span>)}</div></aside>
        <div className="lp-exam-question">
          <small>QUESTION {String(qi+1).padStart(2,"0")}</small>
          <h2>{item.prompt}</h2>
          <label htmlFor="answer">你的回答（语音转写后可以修改）</label><textarea id="answer" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="点击下方麦克风开始回答，或直接输入你的理解…"/>
          <div className="lp-answer-actions">
            <button className={`lp-voice ${listening?"recording":""}`} disabled={!voiceSupported} onClick={dictate}><span>{listening?"■":"●"}</span>{listening?"结束录音":"语音回答"}</button>
            <button className="lp-primary" disabled={busy||!answer.trim()} onClick={submit}>{busy?"AI 正在分析…":qi===items.length-1?"完成挑战并评分 →":"提交，下一题 →"}</button>
          </div>
          {!voiceSupported&&<p className="lp-help">当前浏览器不支持语音识别，请使用最新版 Chrome / Edge，或直接文字作答。</p>}
          {error&&<p className="lp-error">{error}</p>}
        </div>
      </div>
    </section>}
    {view==="celebration"&&<section className="lp-content lp-ceremony-page"><article className="lp-certificate"><div className="lp-certificate-spark">✦</div><span className="lp-kicker">PENINSULA LEARNING MOMENT</span><div className="lp-certificate-seal">🏅</div><h1>学习表现荣誉证书</h1><p className="lp-certificate-recipient">颁发给 <b>{profile?.name||"盛思婕"}</b></p><p className="lp-certificate-course">{testMode==="final"?"L3 声光电基础 · 总章节挑战":`${mid} · ${modules.find(m=>m.id===mid)?.title||"章节挑战"}`}</p><div className="lp-certificate-score"><strong>{total}</strong><span>分</span><i>/ 100</i></div><h2>{total>=90?"优秀表现，真的很棒！":total>=80?"出色完成，继续保持！":"每一次认真作答，都在让你更进一步。"}</h2><p className="lp-certificate-praise">{total>=90?`${profile?.name||"同学"}，你对课程要点的掌握非常扎实。这份高分是认真学习的最好证明，继续带着这份自信闯关吧！`:total>=80?"你已经展现出很好的理解力，稳定地把知识点说出来就是专业成长。下一关也一起加油！":"感谢你认真完成挑战。测评会帮我们找到下一步学习方向，带着收获继续练习，你一定会越来越熟练。"}</p><div className="lp-certificate-footer"><span>半岛黄埔军校 · 学习陪练</span><b>半小岛 为你加油</b></div><button className="lp-primary lp-certificate-continue" onClick={()=>setView("report")}>查看 AI 答题分析 →</button></article></section>}
    {view==="report"&&<section className="lp-content">
      <div className="lp-report-header lp-report-pro">
        <img src="/assets/peninsula-companion.webp" alt="半小岛"/><div><span className="lp-kicker">{testMode==="final"?"FINAL REPORT":`${mid} CHALLENGE REPORT`}</span><h1>{passed?(testMode==="final"?"终局通关，专业力已点亮！":canSkipChapter?"一测通关，直接拿章！":"复测成功，本关拿下！"):total>=90?"高分表现，专业度很亮眼！":"你的认真作答，正在变成专业底气"}</h1><p>{passed?"太棒了！你已经清楚表达关键知识点，继续带着这份自信迎接下一关。":total>=90?`拿到 ${total} 分，表现非常出色！AI 发现一处值得再校准的表达，下面一起看看，修正后就离通关更近一步。`:"你已经打下很好的基础，AI 帮你找到下一步最值得补强的要点。每次练习都在进步。"}</p></div>
        <div className={`lp-total ${passed?"pass":""}`}><strong>{total}</strong><span>/100</span></div>
      </div>
      {diagnosis.length>0&&<div className="lp-diagnosis"><h4>诊断</h4><p>{diagnosis.join(" · ")}</p></div>}
      {blockers.length>0&&<div className="lp-error">误区：{blockers.join("；")}</div>}
      <div className="lp-report-layout">
        <div>{scores.map((s,i)=><article className="lp-card" key={s.itemId}><h3>{items[i].prompt}</h3><b>{s.total} 分</b><p>{s.feedback.gap}</p>{s.missingPoints.length>0&&<div className="lp-missing-guide"><small>本题遗漏要点 · 建议观看位置</small>{s.missingPoints.map(point=>{const target=locateVideoNode(items[i].moduleId,point);return <button key={point} onClick={()=>lesson(items[i].moduleId,target?.[0]||0)}><span>{point}</span><b>{target?.[1]||"本节关键知识点"} · 点击回看 →</b></button>})}</div>}</article>)}</div>
        <aside className="lp-card lp-next">
          {passed?<><span className="lp-big-medal">🏅</span><h3>{testMode==="final"?"L3 总勋章已获得":"章节勋章已点亮"}</h3><p className="lp-medal-praise">{testMode==="final"?"太棒了！你已经把六个模块的知识串成完整判断框架，这份专业积累值得骄傲。继续把学到的内容转化成客户听得懂的表达！":canSkipChapter?`漂亮通关！课前就能讲清 ${mid} 的关键因果链，说明你的基础很扎实。带着这份自信继续挑战下一关！`:`做得好！你认真补齐了 ${mid} 的知识要点，也把理解讲得更完整了。每一次复测都在让专业表达更稳，继续保持！`}</p><button className="lp-primary" onClick={()=>setView("overview")}>返回闯关地图 →</button></>:<><h3>精准补给路线</h3><p>{testMode==="final"?"回到薄弱章节，补齐知识后再次挑战。":"完成视频学习后使用另一组题目复测。"}</p><button className="lp-primary" onClick={()=>lesson(testMode==="final"?(scores.reduce((a,b)=>a.total<=b.total?a:b).moduleId):mid)}>回到课程补给 →</button></>}
        </aside>
      </div>
    </section>}
    </>}
  </div>
  <div className={`lp-pet-dock ${petVisible||assistantOpen?"awake":""}`}>
    {assistantOpen&&<section className="lp-pet-panel" aria-label="半小岛 AI 助教"><header><img src="/assets/peninsula-companion.webp" alt="半小岛"/><div><b>{profile?.name?`${profile.name}的半小岛`:"半小岛"}</b><small>{profile?.role==="new_hire"?"新人循序带教模式":"专业薄弱点巩固模式"}</small></div><button onClick={()=>{setAssistantOpen(false);setPetVisible(false);}}>×</button></header>{guide&&<p className="lp-pet-guide">{guideLoading?"正在准备今日学习建议…":guide}</p>}<div className="lp-pet-messages">{messages.slice(-8).map((m,i)=><article className={m.role} key={i}><b>{m.role==="assistant"?"半小岛":"你"}</b><p>{m.content}</p></article>)}{chatBusy&&<p>半小岛正在结合你的学习记录思考…</p>}</div><form onSubmit={e=>{e.preventDefault();ask();}}><input value={input} onChange={e=>setInput(e.target.value)} placeholder="问课程内容或下一步学什么"/><button className="lp-primary" disabled={chatBusy||!input.trim()}>发送</button></form><button className="lp-pet-course" onClick={()=>{setAssistantOpen(false);setPetVisible(false);lesson(mid);}}>继续当前关卡：{stageMeta[mid].title} →</button></section>}
    {!petVisible&&!assistantOpen&&<button className="lp-pet-wake" onClick={()=>setPetVisible(true)} aria-label="唤醒半小岛">唤醒半小岛</button>}
    {petVisible&&!assistantOpen&&<div className="lp-pet-awake"><div className={`lp-pet-speech ${welcomeOpen?"welcome":""}`}><b>{profile?.name||"同学"}你好呀{welcomeOpen?"，我是半小岛！":""}</b><p>{welcomeOpen?"欢迎来到学习中心。今天想先挑战一节，还是有课程问题想和我聊聊？":view==="test"?"别紧张，按自己的理解说就好；提交后我会陪你一起梳理要点。":view==="lesson"?"看视频时留意关键节点，有疑问随时叫我；看完我们再一起复测。":view==="personal"?"从你的优势出发，挑一个想提升的点，我们可以一起练练。":"今天先选一关试试吧，课前测一测，学会的内容就能直接点亮勋章。"}</p>{welcomeOpen&&<><button className="lp-primary" onClick={()=>{setWelcomeOpen(false);localStorage.setItem("half-island-welcome-v1","seen");setAssistantOpen(true);}}>和我聊聊 →</button><button className="lp-pet-welcome-close" onClick={()=>{setWelcomeOpen(false);localStorage.setItem("half-island-welcome-v1","seen");}} aria-label="关闭欢迎消息">×</button></>}</div><div className="lp-pet-mascot-control"><button className="lp-pet-avatar" onClick={()=>{setWelcomeOpen(false);localStorage.setItem("half-island-welcome-v1","seen");setAssistantOpen(true);}} aria-label="打开半小岛"><img src="/assets/peninsula-companion.webp" alt="半小岛"/><i>AI</i></button><button className="lp-pet-hide" onClick={()=>{setPetVisible(false);setWelcomeOpen(false);localStorage.setItem("half-island-welcome-v1","seen");}} aria-label="隐藏半小岛">×</button></div></div>}
  </div>
 </div>;
}
