"use client";
import { useEffect, useRef, useState } from "react";
import { Home, LayoutGrid, MessageCircle, Mic, Send, Sparkles, Square } from "lucide-react";
import AcademyEmblem from "@/components/AcademyEmblem";
import { DirectionIcon, DirectionLabel } from "@/components/DirectionalIcon";
import { modules, questionBank, selectAssessment } from "@/lib/course";
import { summarize, getPreTestDiagnosis } from "@/lib/scoring";
import type { AssessmentItem, ScoreResult } from "@/lib/types";
import PersonalHome from "@/components/PersonalHome";
import FloatingCompanion from "@/components/FloatingCompanion";
import { COURSE_MANIFEST_KEY, getCourseVideo } from "@/lib/client-course-store";
import "./learning.css";
import "./learning-platform-extras.css";
import "./course-overview.css";

type View = "assistant" | "overview" | "lesson" | "test" | "celebration" | "report" | "chapterCelebration" | "chapterJourney" | "personal";
type Message = { role: "user" | "assistant"; content: string };
type ChatSession = { id:string; title:string; updatedAt:string; messages:Message[]; suggestedModules:string[] };
type RecentAttempt = { moduleId:string; moduleTitle:string; question:string; answer:string; score:number; hitPoints:string[]; missingPoints:string[]; blockers:string[]; createdAt:string };
type LearningMemory = { profile:{name:string;role:string}; earnedBadges:string[]; masteredPoints:string[]; weakPoints:string[]; recentAttempts:RecentAttempt[] };
type ChatSpeechRecognition = {lang:string;continuous:boolean;interimResults:boolean;onresult:((event:{results:ArrayLike<{0:{transcript:string}}>} )=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort?:()=>void};
type SpeechWindow = Window & {SpeechRecognition?:new()=>ChatSpeechRecognition;webkitSpeechRecognition?:new()=>ChatSpeechRecognition};

function NewChatIcon({size=18}:{size?:number}){
 return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13.5a3 3 0 0 1-3 3H9l-5 4V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z"/><path d="M12 7.5v7m-3.5-3.5h7"/></svg>;
}
function ChatVoiceButton({value,onChange,onSend,disabled=false,compact=false}:{value:string;onChange:(value:string)=>void;onSend:()=>void;disabled?:boolean;compact?:boolean}){
 const [supported,setSupported]=useState(false),[listening,setListening]=useState(false),[notice,setNotice]=useState("");
 const recognition=useRef<ChatSpeechRecognition|null>(null),baseText=useRef("");
 useEffect(()=>{
   const browserWindow=window as SpeechWindow;
   const check=browserWindow.setTimeout(()=>setSupported(Boolean(browserWindow.SpeechRecognition||browserWindow.webkitSpeechRecognition)),0);
   return()=>{browserWindow.clearTimeout(check);recognition.current?.abort?.();};
 },[]);
 useEffect(()=>{if(disabled&&listening)recognition.current?.stop?.();},[disabled,listening]);
 function toggle(){
   if(listening){recognition.current?.stop?.();return;}
   const browserWindow=window as SpeechWindow,Recognition=browserWindow.SpeechRecognition||browserWindow.webkitSpeechRecognition;
   if(!Recognition){setSupported(false);setNotice("当前浏览器不支持语音识别");return;}
   const instance=new Recognition();
   baseText.current=value.trim()?`${value.trimEnd()} `:"";
   instance.lang="zh-CN";instance.continuous=true;instance.interimResults=true;
   instance.onresult=(event)=>{
     let transcript="";
     for(let index=0;index<event.results.length;index++)transcript+=event.results[index][0]?.transcript||"";
     onChange(`${baseText.current}${transcript}`);
   };
   instance.onerror=(event)=>{
     const messages:Record<string,string>={"not-allowed":"请在浏览器中允许麦克风权限","service-not-allowed":"浏览器未开放语音识别服务","no-speech":"没有识别到语音，请再试一次","audio-capture":"未检测到可用麦克风",network:"语音识别网络暂不可用"};
     setNotice(messages[event.error]||"语音识别未完成，请重试");setListening(false);
   };
   instance.onend=()=>{setListening(false);setNotice(current=>current==="正在聆听…"?"已转写，可编辑后发送":current);};
   recognition.current=instance;setNotice("正在聆听…");setListening(true);
   try{instance.start();}catch{setListening(false);setNotice("无法启动麦克风，请重试");}
 }
 return <div className={`lp-chat-voice-control ${compact?"compact":""}`}>
   <button type="button" className={`lp-chat-voice ${listening?"listening":""}`} onClick={()=>{if(listening)toggle();else if(value.trim())onSend();else toggle();}} disabled={disabled||(!listening&&!value.trim()&&!supported)} aria-label={listening?"结束语音输入":value.trim()?"发送消息":"语音输入"} title={listening?"结束语音输入":value.trim()?"发送消息":!supported?"请使用最新版 Chrome 或 Edge 并允许麦克风权限":"语音转文字"}>
     {listening?<Square size={18} aria-hidden="true"/>:value.trim()?<Send size={18} aria-hidden="true"/>:<Mic size={18} aria-hidden="true"/>}
   </button>
   <small className="lp-chat-voice-status" aria-live="polite">{!supported?(compact?"":"Chrome / Edge 语音输入"):notice}</small>
 </div>;
}

const courses = ["行业与职业认知", "皮肤基础与需求洞察", "声光电基础", "产品与项目知识", "客户沟通与咨询", "销售实战与异议处理", "合规与长期经营"];
const demoChatSessions:ChatSession[]=[
 {id:"demo-today",title:"今天该学什么？",updatedAt:"刚刚",suggestedModules:["P1","P2"],messages:[{role:"user",content:"我今天有半小时，应该先学什么？"},{role:"assistant",content:"建议先用 10 分钟完成 P1 课前自测。如果能讲清“设备输出能量，而不是直接输出功效”，就可以把视频作为选看；如果暴露出能量传播或靶点理解缺口，再精准看对应片段。剩余时间可以进入 P2，建立光的传播与吸收主线。"}]},
 {id:"demo-review",title:"复盘最近的薄弱点",updatedAt:"昨天",suggestedModules:["P1","P5"],messages:[{role:"user",content:"帮我复盘一下最近最需要加强的地方。"},{role:"assistant",content:"你对基础概念的记忆不错，但销售表达中容易把“参数”“能量”和“效果”放在同一层讨论。下一步建议重点练习：先识别客户诉求，再说明作用层次、靶组织与组织反应，最后给出安全边界和下一步行动。"}]},
 {id:"demo-sales",title:"客户问能量越高越好吗",updatedAt:"10 月 23 日",suggestedModules:["P5","P6"],messages:[{role:"user",content:"客户问能量越高是不是效果越好，我怎么回答？"},{role:"assistant",content:"可以先认可客户对效果的关注，再说明效果并不由单一能量数值决定，还要看作用层次、时间、范围、靶组织及个体反应。最后把沟通引导到专业评估，而不是直接承诺参数或效果。"}]},
];
const stageMeta:Record<string,{title:string;kicker:string;icon:string}>={P1:{title:"破译能量链",kicker:"看懂设备改变组织的底层逻辑",icon:"⚡"},P2:{title:"追踪光的旅程",kicker:"跟随一束光进入皮肤",icon:"◉"},P3:{title:"破解射频升温",kicker:"找出电能变成热的关键机关",icon:"⌁"},P4:{title:"锁定深层焦区",kicker:"探索看不见的机械波路径",icon:"◎"},P5:{title:"调控能量地图",kicker:"掌握参数与组织反应的平衡",icon:"⌘"},P6:{title:"设备策略终局",kicker:"用六问建立设备判断框架",icon:"◇"}};
const fallbackVideos:Record<string,string>={P1:"/videos/l3-p1.mp4",P2:"/videos/l3-p2.mp4",P3:"/videos/l3-p3.mp4",P5:"/videos/l3-p5.mp4"};
const chapterSceneQuestions:AssessmentItem[]=[
 {id:"L3-SCENE-01",moduleId:"P1",level:"transfer",prompt:"客户问：医美设备输出能量，是不是能量越高、效果就一定越好？请你用客户听得懂的方式回应。",followUp:"你会怎样进一步了解客户的真实诉求？",reference:"能量并不直接等于效果，需要结合目标层次、靶组织、组织反应和安全边界综合判断。",requiredPointIndexes:[0,1,2]},
 {id:"L3-SCENE-02",moduleId:"P2",level:"transfer",prompt:"一位客户希望改善肤色问题，并追问‘为什么不同光类项目效果不一样’。请你说明判断思路，而不是直接推荐项目。",followUp:"如何避免在信息不足时直接推荐项目？",reference:"先了解诉求，再说明不同波长与组织吸收差异，最终需要专业评估后匹配方案。",requiredPointIndexes:[0,1,2]},
 {id:"L3-SCENE-03",moduleId:"P3",level:"transfer",prompt:"客户说：‘射频就是把皮肤加热，温度越高越有效。’你会如何纠正这个理解，并管理效果预期？",followUp:"温度之外还需要考虑哪些因素？",reference:"射频通过电流与组织阻抗生热，效果与温度、时间、层次和安全边界共同相关。",requiredPointIndexes:[0,1,2]},
 {id:"L3-SCENE-04",moduleId:"P4",level:"transfer",prompt:"请向第一次接触医美的客户，用一个通俗比喻解释光、射频和超声在作用方式上的主要差异。",followUp:"你的比喻如何保持专业准确？",reference:"光依赖选择性吸收，射频依赖电流与阻抗生热，超声以机械波传播并聚焦。",requiredPointIndexes:[0,1,2]},
 {id:"L3-SCENE-05",moduleId:"P6",level:"transfer",prompt:"客户拿着网络案例要求‘照着同样参数做’，并承诺一定达到同样效果。你会怎样回应并推进后续沟通？",followUp:"如何在不承诺效果的前提下继续服务客户？",reference:"不承诺相同效果，解释个体差异和风险边界，建议完成专业评估后再制定方案。",requiredPointIndexes:[0,1,2]},
];
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
function analyzeSceneAnswer(answer:string,index:number){
 const compact=answer.replace(/\s/g,"");
 const improvements=[
  {focus:"先承接客户问题，再给出判断框架",action:"建议使用“先确认诉求，再区分能量与效果，最后说明层次、靶组织和安全边界”的三步表达。"},
  {focus:"避免过早推荐，补充需求澄清",action:"先询问客户最在意的表现、既往情况和预期，再解释波长与组织吸收差异，最后引导专业评估。"},
  {focus:"把机制、效果与风险串成因果链",action:"可按“阻抗生热、温度与时间共同作用、组织反应和风险控制”的顺序组织回答，避免只讨论温度高低。"},
  {focus:"通俗比喻之后补回专业边界",action:"建议分别说明光的选择性吸收、射频的电流阻抗和超声的机械波聚焦，确保比喻不替代专业解释。"},
  {focus:"增强预期管理与下一步引导",action:"明确不复制参数、不承诺相同效果，再说明个体评估、风险边界和可执行的后续沟通安排。"},
 ];
 const result=improvements[index]||improvements[0];
 if(compact.length<35)return {...result,observation:"回答较简短，核心态度已经表达，但判断依据和沟通步骤还可以更完整。"};
 if(!/[因为所以首先其次需要结合如果]/.test(compact))return {...result,observation:"信息点较丰富，但表达结构略平。加入顺序词和因果连接，会更便于客户理解。"};
 return {...result,observation:"回答已经具备较完整的沟通结构。下一步重点是压缩术语，并把专业边界转化为客户可执行的建议。"};
}

export default function LearningPlatform(){
 const [level,setLevel]=useState(3),[view,setView]=useState<View>("assistant"),[mid,setMid]=useState("P1");
 const [badges,setBadges]=useState<string[]>([]),[watched,setWatched]=useState<string[]>([]),[required,setRequired]=useState<string[]>([]);
 const [lessonSessions,setLessonSessions]=useState<Record<string,Message[]>>({}),[input,setInput]=useState(""),[chatBusy,setChatBusy]=useState(false),[modelMode,setModelMode]=useState("");
 const [globalMessages,setGlobalMessages]=useState<Message[]>([]),[globalInput,setGlobalInput]=useState(""),[globalBusy,setGlobalBusy]=useState(false);
 const [chatSessions,setChatSessions]=useState<ChatSession[]>(demoChatSessions),[activeChatId,setActiveChatId]=useState("demo-today"),[homeChatInput,setHomeChatInput]=useState(""),[homeChatBusy,setHomeChatBusy]=useState(false),[historyCollapsed,setHistoryCollapsed]=useState(false);
 const [items,setItems]=useState<AssessmentItem[]>([]),[qi,setQi]=useState(0),[answer,setAnswer]=useState(""),[scores,setScores]=useState<ScoreResult[]>([]),[submittedAnswers,setSubmittedAnswers]=useState<Array<{itemId:string;answer:string}>>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[listening,setListening]=useState(false),[voiceSupported,setVoiceSupported]=useState(false);
 const [testMode,setTestMode]=useState<"pre"|"post"|"final"|"scene">("pre"),[videoDuration,setVideoDuration]=useState(0),[pendingSeek,setPendingSeek]=useState(0);
 const [sceneAnswers,setSceneAnswers]=useState<Array<{question:string;answer:string}>>([]);
 const [canSkipChapter,setCanSkipChapter]=useState(false),[progressSummary,setProgressSummary]=useState("");
 const [profile,setProfile]=useState<{name:string;role:string;registrationInfo?:{specialization?:string}}|null>(null);
 const [assistantOpen,setAssistantOpen]=useState(false),[guide,setGuide]=useState(""),[guideLoading,setGuideLoading]=useState(false);
 const [recentAttempts,setRecentAttempts]=useState<RecentAttempt[]>([]);
 const [lessonGuide,setLessonGuide]=useState<Record<string,string>>({});
 const [publishedContent,setPublishedContent]=useState<Record<string,{videoUrl?:string;guide?:string;nodes?:Array<{ratio:number;label:string}>}>>({});
 const video=useRef<HTMLVideoElement>(null),speech=useRef<any>(null),chatEnd=useRef<HTMLDivElement>(null),globalChatEnd=useRef<HTMLDivElement>(null),homeChatEnd=useRef<HTMLDivElement>(null);
 const item=items[qi],mod=modules.find(m=>m.id===(testMode==="final"&&item?item.moduleId:mid))!;
 const chapterBadges=badges.filter(id=>/^P[1-6]$/.test(id)),allChaptersDone=modules.every(m=>badges.includes(m.id));
 const summary=scores.length?summarize(scores):null;
 const total=summary?.total||0;
 const blockers=scores.flatMap(s=>s.blockers);
 const passed=testMode==="pre"?canSkipChapter:Boolean(summary&&total>=80&&!blockers.length);
 const userId="demo-user";
 const messages=lessonSessions[mid]||[];
 const videos:Record<string,string>={...fallbackVideos,...Object.fromEntries(Object.entries(publishedContent).filter(([,item])=>item.videoUrl).map(([id,item])=>[id,item.videoUrl!]))};
 const publishedVideoNodes:Record<string,Array<[number,string]>>={...videoNodes,...Object.fromEntries(Object.entries(publishedContent).filter(([,item])=>item.nodes?.length).map(([id,item])=>[id,item.nodes!.map(node=>[node.ratio,node.label] as [number,string])]))};
 const activeChat=chatSessions.find(session=>session.id===activeChatId)||chatSessions[0];

 useEffect(()=>{
   try{
     let savedBadges:string[]=JSON.parse(localStorage.getItem("l3-badges-v2")||"[]");
     let savedWatched:string[]=JSON.parse(localStorage.getItem("l3-watched-v2")||"[]");
     let savedRequired:string[]=JSON.parse(localStorage.getItem("l3-required-v1")||"[]");
     const savedAttempts:RecentAttempt[]=JSON.parse(localStorage.getItem("l3-short-memory-v1")||"[]");
     setLessonSessions(JSON.parse(localStorage.getItem("half-island-course-sessions-v1")||"{}"));
     setGlobalMessages(JSON.parse(localStorage.getItem("half-island-global-session-v1")||"[]"));
     const storedChats=JSON.parse(localStorage.getItem("half-island-chat-home-v1")||"null") as ChatSession[]|null;
     if(Array.isArray(storedChats)&&storedChats.length){setChatSessions(storedChats);setActiveChatId(localStorage.getItem("half-island-active-chat-v1")||storedChats[0].id);}
     if(localStorage.getItem("l3-p1-pretest-demo-v1")!=="ready"){
       savedBadges=savedBadges.filter(id=>id!=="P1"&&id!=="L3-final");
       savedWatched=savedWatched.filter(id=>id!=="P1");
       savedRequired=savedRequired.filter(id=>id!=="P1");
       localStorage.setItem("l3-badges-v2",JSON.stringify(savedBadges));
       localStorage.setItem("l3-watched-v2",JSON.stringify(savedWatched));
       localStorage.setItem("l3-required-v1",JSON.stringify(savedRequired));
       localStorage.setItem("l3-p1-pretest-demo-v1","ready");
     }
     setBadges(savedBadges);setWatched(savedWatched);setRequired(savedRequired);setRecentAttempts(savedAttempts);
   }catch{}
   const w=window as any;setVoiceSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));

   fetch(`/api/user/profile?userId=${userId}`).then(r=>r.json() as Promise<{progressSummary?:string;profile?:{name:string;role:string;registrationInfo?:{specialization?:string}}}>).then(data=>{
     if(data.progressSummary) setProgressSummary(data.progressSummary);
     if(data.profile) setProfile(data.profile);
   }).catch(()=>{});

   const syncPublished=async()=>{
     const r=await fetch("/api/admin/courses",{cache:"no-store"});
     const base=await r.json() as {modules?:Record<string,{videoUrl?:string;guide?:string;nodes?:Array<{ratio:number;label:string}>;status?:string}>};
     let modulesMap=base.modules||{};
     try{const local=JSON.parse(localStorage.getItem(COURSE_MANIFEST_KEY)||"null") as {modules?:typeof modulesMap}|null;if(local?.modules)modulesMap={...modulesMap,...local.modules};}catch{}
     const live=Object.fromEntries(Object.entries(modulesMap).filter(([,entry])=>entry.status==="published"));
     for(const [id,entry] of Object.entries(live)){if(entry.videoUrl?.startsWith("indexeddb://")){const stored=await getCourseVideo(id);if(stored?.blob)entry.videoUrl=URL.createObjectURL(stored.blob);}}
     setPublishedContent(live);
     setLessonGuide(prev=>({...prev,...Object.fromEntries(Object.entries(live).filter(([,entry])=>entry.guide).map(([id,entry])=>[id,entry.guide!]))}));
   };
   syncPublished().catch(()=>{});
   const onCourseUpdate=(event:StorageEvent)=>{if(event.key===COURSE_MANIFEST_KEY)syncPublished().catch(()=>{});};
   window.addEventListener("storage",onCourseUpdate);
   const channel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("peninsula-course-sync"):null;
   if(channel)channel.onmessage=event=>{if(event.data?.type==="course-published")syncPublished().catch(()=>{});};
   const requestedModule=new URLSearchParams(window.location.search).get("module");
   if(requestedModule&&/^P[1-6]$/.test(requestedModule))setTimeout(()=>lesson(requestedModule),0);

   const dayKey=`l3-ai-guide-v2-${new Date().toLocaleDateString("en-CA")}`;
   const savedGuide=localStorage.getItem(dayKey);
   if(savedGuide) setGuide(savedGuide);
   else {
     setGuideLoading(true);
     fetch("/api/user/daily-guide",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,courseId:"L3-SG-01",earnedBadges:JSON.parse(localStorage.getItem("l3-badges-v2")||"[]"),recentAttempts:JSON.parse(localStorage.getItem("l3-short-memory-v1")||"[]")})})
       .then(r=>r.json() as Promise<{guide?:string}>).then(data=>{if(data.guide){setGuide(data.guide);localStorage.setItem(dayKey,data.guide);}})
       .catch(()=>setGuide("今天可以先从闯关地图选择一节进行课前自测；我会结合你的长期进度，帮你把时间留给真正需要补强的知识点。"))
       .finally(()=>setGuideLoading(false));
   }

   return()=>{speech.current?.stop();window.removeEventListener("storage",onCourseUpdate);channel?.close();};
 },[]);

 useEffect(()=>{chatEnd.current?.scrollIntoView({block:"nearest"});},[messages,chatBusy]);
 useEffect(()=>{globalChatEnd.current?.scrollIntoView({block:"nearest"});},[globalMessages,globalBusy]);
 useEffect(()=>{homeChatEnd.current?.scrollIntoView({block:"nearest"});},[activeChat?.messages.length,homeChatBusy]);
 useEffect(()=>{if(assistantOpen&&globalMessages.length===0){const initial=[{role:"assistant" as const,content:`${profile?.name||"同学"}你好呀，我是半小岛。这里是我们的独立学习会话，我会结合你的长期学习档案，陪你规划进度、回顾薄弱点。你也可以指定想聊的课程。`}];setGlobalMessages(initial);localStorage.setItem("half-island-global-session-v1",JSON.stringify(initial));}},[assistantOpen,globalMessages.length,profile?.name]);

 function award(id:string){setBadges(prev=>{const next=Array.from(new Set([...prev,id]));localStorage.setItem("l3-badges-v2",JSON.stringify(next));return next;});}
 function markWatched(){setWatched(prev=>{const next=Array.from(new Set([...prev,mid]));localStorage.setItem("l3-watched-v2",JSON.stringify(next));return next;});}
 function requireLearning(id:string){setRequired(prev=>{const next=Array.from(new Set([...prev,id]));localStorage.setItem("l3-required-v1",JSON.stringify(next));return next;});}
 function learningMemory():LearningMemory{
   const attempts=recentAttempts.slice(-40);
   return {profile:{name:profile?.name||"盛思婕",role:profile?.role||"new_hire"},earnedBadges:badges,masteredPoints:Array.from(new Set(attempts.flatMap(a=>a.hitPoints))).slice(-20),weakPoints:Array.from(new Set(attempts.flatMap(a=>[...a.missingPoints,...a.blockers]))).slice(-20),recentAttempts:attempts};
 }
 function saveLessonSession(moduleId:string,next:Message[]){setLessonSessions(prev=>{const sessions={...prev,[moduleId]:next.slice(-20)};localStorage.setItem("half-island-course-sessions-v1",JSON.stringify(sessions));return sessions;});}
 function chatPayload(question:string,history=messages,moduleId=mid,scope:"lesson"|"global"="lesson"){const m=modules.find(item=>item.id===moduleId);return {moduleId:scope==="lesson"?moduleId:undefined,question,history,userId,learningMemory:learningMemory(),sessionContext:{scope,sessionId:scope==="lesson"?`L3-${moduleId}`:"L3-global",view:scope==="lesson"?"lesson":"learning-center",courseId:"L3-SG-01",moduleId:scope==="lesson"?moduleId:undefined,moduleTitle:scope==="lesson"?m?.title:undefined,videoWatched:scope==="lesson"?watched.includes(moduleId):undefined,postTestUnlocked:scope==="lesson"?watched.includes(moduleId):undefined,currentGoal:scope==="lesson"?m?.objective:"规划学习路径并回顾长期进度"}};}
 function selectLevel(n:number){speech.current?.stop();setListening(false);setLevel(n);setView("overview");setError("");}
 function lesson(id:string,seek=0){
   speech.current?.stop();setListening(false);setTestMode("pre");setMid(id);setInput("");setVideoDuration(0);setPendingSeek(seek);setView("lesson");setError("");
   const m=modules.find(m=>m.id===id);
   if(!lessonSessions[id]?.length)saveLessonSession(id,[{role:"assistant",content:`${profile?.name||"同学"}你好呀，欢迎来到 ${id}「${m?.title}」。我是半小岛，已经准备好陪你学习啦。\n\n这节课我们要解决：${m?.objective}\n\n有问题随时问我。`}]);
   if(!lessonGuide[id]){
     const fallback=`本节围绕“${m?.objective}”展开。记住主线：${m?.anchor}。看视频时重点关注这条因果链怎样从能量传递走到组织反应；不要把设备、参数或标称深度直接等同于效果。`;
     setLessonGuide(prev=>({...prev,[id]:fallback}));
     fetch("/api/course-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(chatPayload(`请根据本节课程资料，用一段约80字的口语化导览总结核心信息和学习主线。只总结，不要反问，不给医疗建议。`,[],id))}).then(r=>r.json() as Promise<{answer?:string;mode?:string}>).then(data=>{if(data.answer)setLessonGuide(prev=>({...prev,[id]:data.answer!}));if(data.mode)setModelMode(data.mode);}).catch(()=>{});
   }
 }
 function startTest(id:string,mode:"pre"|"post"="pre"){
   if(mode==="pre"&&required.includes(id)&&!watched.includes(id)){lesson(id);return;}
   if(mode==="post"&&!watched.includes(id)){lesson(id);return;}
   const pool=questionBank.filter(q=>q.moduleId===id);
   const offset=mode==="post"?1:0;
   setItems((["recall","understand","transfer"] as const).map(l=>pool.filter(q=>q.level===l)[offset]));
   setMid(id);setTestMode(mode);setQi(0);setScores([]);setSubmittedAnswers([]);setAnswer("");setError("");setCanSkipChapter(false);setView("test");
 }
 function startFinalTest(){setItems(selectAssessment());setTestMode("final");setQi(0);setScores([]);setSubmittedAnswers([]);setAnswer("");setError("");setCanSkipChapter(false);setView("test");}
 function startChapterSceneTest(){
   speech.current?.stop();setListening(false);setItems(chapterSceneQuestions);setTestMode("scene");setQi(0);setScores([]);setSubmittedAnswers([]);setSceneAnswers([]);setAnswer("");setError("");setView("test");
 }
 async function ask(question=input){
   if(!question.trim()||chatBusy)return;
   const history=lessonSessions[mid]||[];
   saveLessonSession(mid,[...history,{role:"user",content:question}]);
   setInput("");setChatBusy(true);
   try{
     const r=await fetch("/api/course-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(chatPayload(question,history,mid,"lesson"))});
     const data=await r.json() as {error?:string;mode:string;answer:string;source?:string};
     if(!r.ok)throw new Error(data.error||"请求失败");
     setModelMode(data.mode);
     saveLessonSession(mid,[...history,{role:"user",content:question},{role:"assistant",content:`${data.answer}${data.source?`\n\n课程依据：${data.source}`:""}`}]);
   }catch{
     saveLessonSession(mid,[...history,{role:"user",content:question},{role:"assistant",content:"暂时连接不上助教，请稍后重试。"}]);
   }finally{setChatBusy(false);}
 }
 async function askGlobal(question=globalInput){
   if(!question.trim()||globalBusy)return;
   const history=globalMessages;
   const pending=[...history,{role:"user" as const,content:question}].slice(-20);
   setGlobalMessages(pending);localStorage.setItem("half-island-global-session-v1",JSON.stringify(pending));setGlobalInput("");setGlobalBusy(true);
   try{
     const r=await fetch("/api/course-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(chatPayload(question,history,mid,"global"))});
     const data=await r.json() as {error?:string;mode:string;answer:string;source?:string};
     if(!r.ok)throw new Error(data.error||"请求失败");
     setModelMode(data.mode);
     const next=[...pending,{role:"assistant" as const,content:`${data.answer}${data.source?`\n\n课程依据：${data.source}`:""}`}].slice(-20);
     setGlobalMessages(next);localStorage.setItem("half-island-global-session-v1",JSON.stringify(next));
   }catch{
     const next=[...pending,{role:"assistant" as const,content:"暂时连接不上助教，请稍后重试。"}].slice(-20);
     setGlobalMessages(next);localStorage.setItem("half-island-global-session-v1",JSON.stringify(next));
   }finally{setGlobalBusy(false);}
 }
 function storeChatSessions(next:ChatSession[]){setChatSessions(next);localStorage.setItem("half-island-chat-home-v1",JSON.stringify(next));}
 function createHomeChat(){
   const id=`chat-${Date.now()}`;
   const next:ChatSession={id,title:"新的学习对话",updatedAt:"刚刚",suggestedModules:[],messages:[{role:"assistant",content:`${profile?.name||"同学"}你好，我会结合你的学习档案和课程知识陪你解决问题。你可以问我今天学什么、复盘薄弱点，或者练习一个真实销售场景。`}]};
   storeChatSessions([next,...chatSessions]);setActiveChatId(id);localStorage.setItem("half-island-active-chat-v1",id);setHomeChatInput("");
 }
 function selectHomeChat(id:string){setActiveChatId(id);localStorage.setItem("half-island-active-chat-v1",id);setHomeChatInput("");}
 function deleteHomeChat(id:string){
   const remaining=chatSessions.filter(session=>session.id!==id);
   const next=remaining.length?remaining:demoChatSessions.slice(0,1);
   storeChatSessions(next);if(activeChatId===id)selectHomeChat(next[0].id);
 }
 async function askHomeChat(question=homeChatInput){
   if(!question.trim()||homeChatBusy||!activeChat)return;
   const history=activeChat.messages;
   const pending=[...history,{role:"user" as const,content:question}].slice(-30);
   const title=activeChat.title==="新的学习对话"?question.trim().slice(0,16):activeChat.title;
   storeChatSessions(chatSessions.map(session=>session.id===activeChat.id?{...session,title,updatedAt:"刚刚",messages:pending}:session));
   setHomeChatInput("");setHomeChatBusy(true);
   try{
     const r=await fetch("/api/course-chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(chatPayload(question,history,mid,"global"))});
     const data=await r.json() as {error?:string;mode:string;answer:string;source?:string};
     if(!r.ok)throw new Error(data.error||"请求失败");
     setModelMode(data.mode);
     const matched=Array.from(new Set(`${data.answer} ${data.source||""}`.match(/P[1-6]/g)||[]));
     const suggestedModules=matched.slice(0,2);
     const nextMessages=[...pending,{role:"assistant" as const,content:data.answer}].slice(-30);
     storeChatSessions(chatSessions.map(session=>session.id===activeChat.id?{...session,title,updatedAt:"刚刚",messages:nextMessages,suggestedModules}:session));
   }catch{
     const nextMessages=[...pending,{role:"assistant" as const,content:"模型连接刚刚出现波动，请稍后再试。我已经保留了当前会话内容。"}].slice(-30);
     storeChatSessions(chatSessions.map(session=>session.id===activeChat.id?{...session,title,updatedAt:"刚刚",messages:nextMessages,suggestedModules:[]}:session));
   }finally{setHomeChatBusy(false);}
 }
 async function submit(){
   if(!answer.trim()||busy)return;
   speech.current?.stop();setListening(false);setBusy(true);setError("");
   if(testMode==="scene"){
     const next=[...sceneAnswers,{question:item.prompt,answer:answer.trim()}];
     setSceneAnswers(next);
     const attempt:RecentAttempt={moduleId:"L3-scene",moduleTitle:"L3 综合测试",question:item.prompt,answer:answer.trim(),score:100,hitPoints:["已完成销售场景表达"],missingPoints:[],blockers:[],createdAt:new Date().toISOString()};
     const allAttempts=[...recentAttempts,attempt].slice(-40);setRecentAttempts(allAttempts);localStorage.setItem("l3-short-memory-v1",JSON.stringify(allAttempts));
     fetch("/api/assessment/record-response",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,courseId:"L3-scene",questionId:item.id,userAnswer:answer.trim(),score:100,timeSpent:45})}).catch(()=>{});
     if(qi<chapterSceneQuestions.length-1){setQi(qi+1);setAnswer("");setBusy(false);return;}
     award("L3-final");localStorage.setItem("l3-scene-completed-v1",new Date().toISOString());setBusy(false);setView("chapterCelebration");return;
   }
   try{
     let next:ScoreResult[];
     let entries:Array<{item:AssessmentItem;answer:string;score:ScoreResult}>;
     if(testMode==="pre"){
       const pending=[...submittedAnswers.filter(entry=>entry.itemId!==item.id),{itemId:item.id,answer:answer.trim()}];
       setSubmittedAnswers(pending);
       if(qi<items.length-1){setQi(qi+1);setAnswer("");return;}
       const answersByItem=new Map(pending.map(entry=>[entry.itemId,entry.answer]));
       const scored=await Promise.all(items.map(async assessedItem=>{
         const submittedAnswer=answersByItem.get(assessedItem.id);
         if(!submittedAnswer)throw new Error("Missing answer");
         const response=await fetch("/api/assessment/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId:assessedItem.id,answer:submittedAnswer})});
         if(!response.ok)throw new Error("Scoring failed");
         return await response.json() as ScoreResult;
       }));
       next=scored;setModelMode(scored[0]?.mode||"");
       entries=items.map((assessedItem,index)=>({item:assessedItem,answer:answersByItem.get(assessedItem.id)||"",score:scored[index]}));
     }else{
       const response=await fetch("/api/assessment/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({itemId:item.id,answer:answer.trim()})});
       if(!response.ok)throw new Error("Scoring failed");
       const scored=await response.json() as ScoreResult;
       setModelMode(scored.mode);
       next=[...scores,scored];
       entries=[{item,answer:answer.trim(),score:scored}];
     }
     setScores(next);
     const newAttempts=entries.map(({item:scoredItem,answer:submittedAnswer,score:scored})=>{
       const scoredModule=modules.find(module=>module.id===scoredItem.moduleId);
       return {moduleId:scoredItem.moduleId,moduleTitle:scoredModule?.title||stageMeta[scoredItem.moduleId].title,question:scoredItem.prompt,answer:submittedAnswer,score:scored.total,hitPoints:scored.hitPoints,missingPoints:scored.missingPoints,blockers:scored.blockers,createdAt:new Date().toISOString()};
     });
     const allAttempts=[...recentAttempts,...newAttempts].slice(-40);
     setRecentAttempts(allAttempts);
     localStorage.setItem("l3-short-memory-v1",JSON.stringify(allAttempts));

     entries.forEach(({item:scoredItem,answer:submittedAnswer,score:scored})=>{
       fetch("/api/assessment/record-response",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,courseId:scoredItem.moduleId,questionId:scoredItem.id,userAnswer:submittedAnswer,score:scored.total,timeSpent:30,misconception:scored.blockers[0]})}).catch(()=>{});
     });

     if(testMode!=="pre"&&qi<items.length-1){setQi(qi+1);setAnswer("");}else{
       const summary=summarize(next);
       const preTestResult=testMode==="pre"?getPreTestDiagnosis(next):null;
       const canSkip=preTestResult?.allPassed||false;
       setCanSkipChapter(canSkip);
       if(testMode==="final"&&summary.total>=80&&!summary.blockers.length){award("L3-final");}
       const earned=(testMode==="pre"&&canSkip)||(testMode==="post"&&summary.total>=80&&!summary.blockers.length);
       if(testMode==="pre"&&canSkip){award(mid);}
       else if(testMode==="pre"){requireLearning(mid);}
       else if(testMode==="post"&&summary.total>=80&&!summary.blockers.length){award(mid);}
       const completedModules=new Set([...badges,...(earned?[mid]:[])]);
       if(modules.every(module=>completedModules.has(module.id))){
         const courseAttempts=allAttempts.filter(attempt=>modules.some(module=>module.id===attempt.moduleId));
         const masteredPoints=Array.from(new Set(courseAttempts.flatMap(attempt=>attempt.hitPoints)));
         const strugglingPoints=Array.from(new Set(courseAttempts.flatMap(attempt=>[...attempt.missingPoints,...attempt.blockers])));
         const suggestions=Array.from(new Set(courseAttempts.filter(attempt=>attempt.score<80).map(attempt=>`回看 ${attempt.moduleId}「${attempt.moduleTitle}」，重练：${attempt.missingPoints.join("、")||attempt.blockers.join("、")||"本节核心要点"}`))).slice(0,5);
         fetch("/api/user/memory",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId,courseId:"L3-SG-01",title:"L3 声光电基础",scores:courseAttempts.map(attempt=>attempt.score),masteredPoints,strugglingPoints,suggestions})}).then(response=>response.json() as Promise<{progressSummary?:string}>).then(data=>{if(data.progressSummary)setProgressSummary(data.progressSummary);}).catch(()=>{});
       }
       setView(testMode==="pre"?"report":"celebration");
     }
   }catch{setError(testMode==="pre"?"统一评分暂时不可用，所有回答已保留，请重试。":"暂时无法完成分析，请稍后重试；你的回答已保留。");}finally{setBusy(false);}
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

 const nextModule = modules.find(m=>!badges.includes(m.id)) || modules[0];
 function enterStage(id:string){
   if(!badges.includes(id)&&watched.includes(id))startTest(id,"post");
   else if(!badges.includes(id)&&required.includes(id)&&!watched.includes(id))lesson(id);
   else startTest(id);
 }
 return <div className="lp lp-pro">
  <aside className="lp-sidebar">
    <div className="lp-brand"><span className="lp-brand-emblem"><AcademyEmblem/></span><div><b>医美军校</b><small>销售专业学习中心</small></div></div>
    <button className={`lp-user-mini ${view==="assistant"?"active":""}`} onClick={()=>setView("assistant")} aria-label="进入半小岛对话首页"><span className="lp-mini-mascot"><img src="/assets/peninsula-companion.webp" alt="半小岛"/><i>👋</i></span><div><b>和半小岛聊聊</b><small>学习问题随时问我</small></div></button>
    <button className={`lp-home-nav ${view==="personal"?"active":""}`} onClick={()=>setView("personal")}><span><Home size={20} strokeWidth={2.6} aria-hidden="true"/></span> 成长主页</button>
    <button className={`lp-home-nav ${view!=="personal"&&view!=="assistant"?"active":""}`} onClick={()=>{setLevel(3);setView("overview")} }><span><LayoutGrid size={20} strokeWidth={2.6} aria-hidden="true"/></span> 课程闯关</button>
    <p className="lp-nav-label">学习路径</p>
    <nav>{courses.map((name,i)=><div key={name} data-level={i+1}><button title={`L${i+1} · ${name}`} aria-label={`L${i+1} · ${name}`} aria-current={view!=="assistant"&&view!=="personal"&&level===i+1?"step":undefined} className={view!=="assistant"&&view!=="personal"&&level===i+1?"selected":""} onClick={()=>selectLevel(i+1)}><span className="lp-level-mark">L{i+1}</span><div><b>{name}</b></div></button></div>)}</nav>
    <div className="lp-sidebar-progress"><div><span>本课程进度</span><b className="lp-numeric">{Math.round(chapterBadges.length/6*100)}%</b></div><i><em style={{width:`${chapterBadges.length/6*100}%`}}/></i></div>
  </aside>
  <div className="lp-main">
    <header className={view==="lesson"||view==="test"||view==="report"?"lp-topbar lp-course-topbar":"lp-topbar"}>{(view==="lesson"||view==="test"||view==="report")&&<button type="button" className="lp-secondary lp-course-topbar-back" aria-label="返回六关地图" title="返回六关地图" disabled={view==="test"&&busy} onClick={()=>{speech.current?.stop();setListening(false);setError("");setView("overview");}}><DirectionIcon direction="left" size={19}/></button>}<div className="lp-topbar-identity"><b>{view==="assistant"?"半小岛学习陪练":view==="personal"?"我的成长主页":<><span className="lp-level-mark">L{level}</span> · {courses[level-1]}</>}</b>{view==="lesson"&&<b className="lp-topbar-stage"><span className="lp-level-mark">{mid}</span> {stageMeta[mid].title}</b>}{view==="test"&&item&&<b className="lp-topbar-stage"><span className="lp-level-mark">{testMode==="scene"||testMode==="final"?"L3":item.moduleId}</span> · {testMode==="pre"?"课前挑战":testMode==="post"?"学习复测":testMode==="scene"?"销售场景挑战":"终局考核"}</b>}</div>{view==="lesson"&&<button className="lp-primary lp-posttest-cta" disabled={badges.includes(mid)||!videos[mid]||!watched.includes(mid)} onClick={()=>startTest(mid,"post")}>{watched.includes(mid)?<DirectionLabel>开始课后测试</DirectionLabel>:badges.includes(mid)?"本关已通关 · 视频选看":required.includes(mid)?"看完视频后复测":"看完视频后可参加课后测试"}</button>}{view==="test"&&item&&<div className="lp-exam-navigation-actions">{testMode==="pre"&&<button type="button" className="lp-secondary lp-skip-pretest" disabled={busy} onClick={()=>lesson(mid)}><DirectionLabel>跳过挑战，直接学习</DirectionLabel></button>}</div>}{view!=="lesson"&&view!=="test"&&view!=="report"&&<div className="lp-top-actions"><span>🔥 连续学习 1 天</span></div>}</header>
    {view==="assistant"?<section className={`lp-assistant-home ${historyCollapsed?"history-collapsed":""}`}>
      <aside className="lp-chat-history"><div className="lp-history-toolbar"><button className="lp-history-toggle" onClick={()=>setHistoryCollapsed(!historyCollapsed)} aria-label={historyCollapsed?"展开会话列表":"收起会话列表"}>{historyCollapsed?<DirectionIcon direction="chevron-right"/>:<DirectionIcon direction="chevron-left"/>}</button>{!historyCollapsed&&<button className="lp-new-chat" onClick={createHomeChat}><NewChatIcon size={19}/><span>新建对话</span></button>}</div>{!historyCollapsed&&<><div className="lp-history-label">最近会话</div><div className="lp-history-list">{chatSessions.map(session=><article className={session.id===activeChatId?"active":""} key={session.id} onClick={()=>selectHomeChat(session.id)}><span className="lp-history-icon" aria-hidden="true"><MessageCircle size={18} strokeWidth={2}/></span><div><b>{session.title}</b><small>{session.messages.at(-1)?.content.slice(0,28)}{(session.messages.at(-1)?.content.length||0)>28?"…":""}</small><time>{session.updatedAt}</time></div><button onClick={event=>{event.stopPropagation();deleteHomeChat(session.id)}} aria-label="删除会话">×</button></article>)}</div></>}</aside>
      <div className="lp-chat-stage"><header><div><span className="lp-chat-avatar"><img src="/assets/peninsula-companion.webp" alt="半小岛"/></span><div><b>半小岛</b><small>AI 学习陪练在线 · 已连接课程知识库</small></div></div><button className="lp-chat-new-session" aria-label="新对话" title="新对话" onClick={createHomeChat}><NewChatIcon size={18}/></button></header>
        <div className="lp-chat-scroll">
          <div className="lp-chat-thread">{activeChat?.messages.map((message,index)=><div className={`lp-chat-message ${message.role}`} key={`${activeChat.id}-${index}`}><div className="lp-message-content">{message.role==="assistant"&&<img src="/assets/peninsula-companion.webp" alt=""/>}<div><p>{message.content}</p>{message.role==="assistant"&&index===activeChat.messages.length-1&&activeChat.suggestedModules.length>0&&<div className="lp-message-courses">{activeChat.suggestedModules.map(id=>{const course=modules.find(module=>module.id===id);return course?<button key={id} onClick={()=>lesson(id)}>相关课程：{id} · {stageMeta[id].title}<DirectionLabel size={14}>查看</DirectionLabel></button>:null})}</div>}</div></div></div>)}{homeChatBusy&&<div className="lp-chat-message assistant"><div className="lp-message-content"><img src="/assets/peninsula-companion.webp" alt=""/><div><p className="lp-thinking"><i/><i/><i/>正在结合你的学习记录思考</p></div></div></div>}<div ref={homeChatEnd}/></div>
        </div>
        <div className="lp-composer-shell"><div className="lp-chat-quick">{["今天我该学什么？","帮我复盘最近的薄弱点","练一道客户异议题"].map(text=><button type="button" key={text} disabled={homeChatBusy} onClick={()=>askHomeChat(text)}>{text}</button>)}</div><form className="lp-chat-composer" onSubmit={event=>{event.preventDefault();askHomeChat()}}><textarea value={homeChatInput} onChange={event=>setHomeChatInput(event.target.value)} placeholder="问课程难点、学习进度，或描述一个客户沟通场景…"/><div className="lp-composer-buttons"><ChatVoiceButton value={homeChatInput} onChange={setHomeChatInput} onSend={()=>askHomeChat()} disabled={homeChatBusy}/></div></form></div>
      </div>
    </section>:view==="personal"?<section className="lp-content"><div className="lp-section-title"><div><small>MY LEARNING SPACE</small><h2>早上好，{profile?.name||"学员"}</h2></div><p>你的私人助教正在持续了解你的学习进度</p></div><PersonalHome userId={userId} onOpenAssistant={()=>setView("assistant")}/><div className="lp-personal-course-action"><button className="lp-primary" onClick={()=>{setLevel(3);setView("overview")}}><DirectionLabel>进入课程学习</DirectionLabel></button></div></section>:level!==3?<section className="lp-placeholder"><div>◇</div><small><span className="lp-level-mark">L{level}</span> · PREPARING</small><h1>{courses[level-1]}</h1><p>该阶段将依次完成小节课前挑战、视频学习、复测夺章与 <span className="lp-level-mark">L{level}</span> 总章节语音考核。课程内容和题库正在建设中。</p><div className="lp-placeholder-final"><span>🏆</span><div><b><span className="lp-level-mark">L{level}</span> 总章节语音考核</b><small>完成本阶段全部小节后解锁 · 80 分通关</small></div><button disabled>待课程开放</button></div><button className="lp-primary" onClick={()=>selectLevel(3)}><DirectionLabel>先体验 <span className="lp-level-mark">L3</span> 完整流程</DirectionLabel></button></section>:<>
    {view==="overview"&&<section className="lp-content lp-course-overview" id="course-center">
      <div className="course-intro"><div><span className="course-eyebrow"><span className="lp-level-mark">L3</span> · 声光电基础</span><h1>看懂能量，赢下专业表达。</h1><p>从理解能量到判断设备，沿着六关练出有依据的专业表达。</p><div className="course-intro-actions"><button className="lp-primary" onClick={()=>enterStage(nextModule.id)}><DirectionLabel direction="up-right">{chapterBadges.length===6?"重温第一关":"继续学习 · "+nextModule.id}</DirectionLabel></button></div></div><div className="course-progress"><span>本章已完成</span><div><strong className="lp-numeric">{chapterBadges.length}</strong><span>/ 6 关</span></div><progress value={chapterBadges.length} max={6} aria-label="六关课程完成进度"/><small>{chapterBadges.length===6?"六关已通关，去综合测试练练表达":"下一步："+stageMeta[nextModule.id].title}</small></div></div>
      <div className="lp-section-title"><div><h2>六关能力地图</h2></div><p>课前挑战、精准学习与复测夺章</p></div>
      <div className="lp-challenge-grid">{modules.map((m,i)=>{
        const done=badges.includes(m.id),current=!done&&m.id===nextModule.id,needsCourse=required.includes(m.id),hasWatched=watched.includes(m.id);
        const action=done?"pre":hasWatched?"post":needsCourse?"lesson":"pre";
        return <article className={done?"done":current?"is-current":"is-ready"} key={m.id} aria-label={"第 "+String(i+1).padStart(2,"0")+" 关 "+stageMeta[m.id].title+(current?"，建议继续":"")}>
          <div className="lp-stage-top"><span className="lp-stage-order">第 {String(i+1).padStart(2,"0")} 关</span><span className={`lp-stage-status${done?" done":""}`}>{done?"✓ 已完成":current?"● 建议继续":"可学习"}</span></div>
          <h3>{stageMeta[m.id].title}</h3>
          <p className="lp-stage-outcome">{["讲清能量如何改变组织","解释光的传播与选择性吸收","理解电流、阻抗与生热的关系","区分机械波传播与聚焦作用","结合参数判断组织反应与风险","用六问框架建立设备判断思路"][i]}</p>
          <div className="lp-stage-actions"><button className="lp-primary stage-main-action" onClick={()=>enterStage(m.id)}><DirectionLabel>{done?"再次挑战":action==="post"?"课后复测":action==="lesson"?"开始学习":"课前自测"}</DirectionLabel></button>{action!=="lesson"&&<button className="lp-secondary stage-course-action" onClick={()=>lesson(m.id)}>查看课程</button>}</div>
        </article>;
      })}</div>
      <section className="course-final"><div className="course-final-icon" aria-hidden="true">✦</div><div><h2><span className="lp-level-mark">L3</span> 综合测试</h2><p>把学到的原理，转化为客户听得懂的专业表达。</p></div><button className="lp-primary" onClick={startChapterSceneTest}><DirectionLabel>{badges.includes("L3-final")?"再次练习":"开始综合测试"}</DirectionLabel></button></section>
    </section>}
    {view==="lesson"&&<section className="lp-content lp-lesson-page">
      <div className="lp-lesson-heading"><article className="lp-card lp-ai-guide"><div><span className="lp-ai-guide-title">✦ AI 课程导览</span></div><p>{lessonGuide[mid]||"正在整理本节学习主线…"}</p></article></div>
      <div className="lp-workspace">
        <div className="lp-lesson-media-column">
          <div className="lp-player">{videos[mid]?<video key={mid} ref={video} controls preload="metadata" src={videos[mid]} onLoadedMetadata={e=>{const duration=e.currentTarget.duration;setVideoDuration(duration);if(pendingSeek>0){e.currentTarget.currentTime=duration*pendingSeek;e.currentTarget.play().catch(()=>{});setPendingSeek(0);}}} onEnded={markWatched}/>:<div className="lp-video-empty"><span>{stageMeta[mid].icon}</span><small>COMING SOON</small><h3>{mid} 课程视频制作中</h3><p>知识导览与 AI 助教仍可使用，视频上线后会在这里呈现。</p></div>}</div>
          <div className="lp-video-timeline"><div className="lp-video-timeline-heading"><b>本节关键点</b><span>点击节点，快速定位视频内容</span></div><div className="lp-video-timeline-track">{(publishedVideoNodes[mid]||[]).map(([ratio,label],i)=><button key={label} disabled={!videos[mid]} onClick={()=>seek(videoDuration*ratio)}><time>{videoDuration&&videos[mid]?time(videoDuration*ratio):String(i+1).padStart(2,"0")}</time><span>{label}</span></button>)}</div></div>
        </div>
        <aside className="lp-tutor lp-lesson-tutor">
          <div className="lp-tutor-heading"><img src="/assets/peninsula-companion.webp" alt="半小岛"/><div><b>半小岛 · AI 视频助教</b><small>{modelMode==="ai"?"真实模型在线":"依据本节资料答疑"}</small></div></div>
          <div className="lp-prompt-buttons">{["三句话总结本关","本关最容易错什么？","给我一个通俗比喻"].map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}</div>
          <div className="lp-chat">{messages.map((m,i)=><div key={i} className={m.role}><p>{m.content}</p></div>)}{chatBusy&&<div className="assistant"><p>正在思考…</p></div>}<div ref={chatEnd}/></div>
          <form onSubmit={e=>{e.preventDefault();ask();}}><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="对视频内容有疑问？直接问我…"/><ChatVoiceButton value={input} onChange={setInput} onSend={()=>ask()} disabled={chatBusy} compact/></form>
        </aside>
      </div>
    </section>}
    {view==="test"&&item&&<section className="lp-content lp-exam">
      <div className="lp-exam-navigation">
        <div className="lp-exam-title"><h1>{testMode==="scene"?"L3 综合测试":testMode==="final"?"声光电终局语音考核":stageMeta[item.moduleId].title}</h1>{(testMode==="scene"||testMode==="final")&&<p>{testMode==="scene"?"共 5 道真实销售场景题。请像面对客户一样用语音作答；本测试不打分，以完成和复盘为主。":"六个模块各一道综合题，80 分且无关键误区即可获得总勋章。"}</p>}</div>
      </div>
      <div className="lp-exam-layout">
        <aside><img src="/assets/peninsula-companion.webp" alt="考核陪伴助手"/><h2>{listening?"我在认真听…":testMode==="scene"?"把我当成客户吧":"准备好了吗？"}</h2><p>{listening?"说完后点击结束录音，你仍可以修改识别文字。":testMode==="scene"?"不用追求标准答案，重点是把判断逻辑说清楚、让客户听得懂。":"建议用自己的话讲清楚逻辑，不必背标准答案。"}</p><div className="lp-test-steps">{items.map((q,i)=><span className={i===qi?"active":i<qi?"done":""} key={q.id}>{i<qi?"✓":i+1}</span>)}</div></aside>
        <div className="lp-exam-question">
          <small>QUESTION {String(qi+1).padStart(2,"0")}</small>
          <h2>{item.prompt}</h2>
          <label htmlFor="answer">你的回答（语音转写后可以修改）</label><textarea id="answer" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="点击下方麦克风开始回答，或直接输入你的理解…"/>
          <div className="lp-answer-actions">
            <button type="button" className={`lp-voice ${listening?"recording":""}`} aria-label={listening?"结束录音":"语音回答"} title={listening?"结束录音":"语音回答"} disabled={!voiceSupported} onClick={dictate}>{listening?<Square size={19} strokeWidth={2.7} aria-hidden="true"/>:<Mic size={22} strokeWidth={2.7} aria-hidden="true"/>}</button>
            <button className={`lp-primary ${busy&&testMode==="pre"&&qi===items.length-1?"lp-scoring":""}`} disabled={busy||!answer.trim()} onClick={submit}>{busy?(testMode==="pre"&&qi===items.length-1?<span className="lp-scoring-state" aria-live="polite"><Sparkles size={18} strokeWidth={2.6} aria-hidden="true"/><span>正在评分</span></span>:testMode==="scene"?"正在保存回答…":testMode==="pre"?"正在保存答案…":"AI 正在分析…"):<DirectionLabel>{qi===items.length-1?(testMode==="scene"?"完成综合测试":"完成挑战并评分"):"提交，下一题"}</DirectionLabel>}</button>
          </div>
          {!voiceSupported&&<p className="lp-help">当前浏览器不支持语音识别，请使用最新版 Chrome / Edge，或直接文字作答。</p>}
          {error&&<p className="lp-error">{error}</p>}
        </div>
      </div>
    </section>}
    {view==="chapterCelebration"&&<section className="lp-content lp-chapter-pass"><article className="lp-chapter-pass-card"><div className="lp-chapter-pass-glow"/><img src="/assets/peninsula-companion.webp" alt="半小岛为学员庆祝"/><span className="lp-kicker"><span className="lp-level-mark">L3</span> CHAPTER COMPLETED</span><div className="lp-chapter-pass-icon">🏆</div><h1>恭喜你完成了本章节的所有测试，顺利通关！</h1><p>{profile?.name||"同学"}，你已经完成 5 个真实销售场景的表达练习。这里不以分数定义你，而是记录你如何把专业知识转化为客户听得懂、愿意继续沟通的表达。</p><div className="lp-chapter-pass-stats"><div><b className="lp-numeric">5 / 5</b><small>场景作答完成</small></div><div><b>语音</b><small>真实表达练习</small></div><div><b>已点亮</b><small><span className="lp-level-mark">L3</span> 章节通关</small></div></div><button className="lp-primary" onClick={()=>setView("chapterJourney")}><DirectionLabel>查看本章节学习旅程</DirectionLabel></button></article></section>}
    {view==="chapterJourney"&&<section className="lp-content lp-journey-report">
      <div className="lp-journey-hero"><div><span className="lp-kicker"><span className="lp-level-mark">L3</span> LEARNING JOURNEY</span><h1>{profile?.name||"学员"}的声光电基础<br/>章节学习旅程</h1><p>从知识理解到销售表达，本页汇总你的学习足迹，并根据本次 5 道场景回答给出下一步优化方法。</p></div><img src="/assets/peninsula-companion.webp" alt="半小岛学习陪练"/></div>
      <div className="lp-journey-metrics"><div><small>章节测试</small><b>5 道场景题已完成</b></div><div><small>课程足迹</small><b>{watched.length} 节视频已观看</b></div><div><small>阶段成果</small><b>{chapterBadges.length} 枚小节勋章</b></div><div><small>陪练方式</small><b>语音表达 + 复盘</b></div></div>
      <section className="lp-journey-path"><h2>本章节，你完成了这些关键动作</h2><div><article><span>01</span><b>建立知识框架</b><p>理解能量、传播、层次、靶组织、组织反应与效果之间的关系。</p></article><DirectionIcon size={20} className="lp-journey-arrow"/><article><span>02</span><b>进入销售场景</b><p>面对客户疑问，练习把专业机制转化为清晰、合规的表达。</p></article><DirectionIcon size={20} className="lp-journey-arrow"/><article><span>03</span><b>完成章节通关</b><p>连续完成 5 道场景题，形成可继续复盘的真实回答记录。</p></article></div></section>
      <section className="lp-scene-review"><div className="lp-section-title"><div><small>ANSWER REVIEW</small><h2>本次回答的优化点与方法</h2></div><p>不打分，只提供下一次可以直接使用的改进动作</p></div><div className="lp-scene-review-list">{sceneAnswers.map((entry,index)=>{const advice=analyzeSceneAnswer(entry.answer,index);return <article key={entry.question}><header><span>场景 {String(index+1).padStart(2,"0")}</span><h3>{entry.question}</h3></header><div className="lp-scene-answer"><small>你的回答</small><p>{entry.answer}</p></div><div className="lp-scene-advice"><div><small>观察</small><p>{advice.observation}</p></div><div><small>优先优化</small><b>{advice.focus}</b><p>{advice.action}</p></div></div></article>})}</div></section>
      <section className="lp-next-practice"><div><span>✦ 半小岛的下一步建议</span><h2>继续练习“客户语言 + 专业依据 + 下一步行动”</h2><p>下一次回答时，先承接客户关注点，再说明判断依据，最后给出安全、明确且可执行的后续建议。这个结构会让专业表达更稳，也更容易建立信任。</p></div><div className="lp-next-practice-actions"><button className="lp-secondary" onClick={startChapterSceneTest}>再练一次场景题</button><button className="lp-primary" onClick={()=>setView("overview")}><DirectionLabel>返回课程闯关地图</DirectionLabel></button></div></section>
    </section>}
    {view==="celebration"&&<section className="lp-content lp-ceremony-page"><article className="lp-certificate"><div className="lp-certificate-spark">✦</div><span className="lp-kicker">PENINSULA LEARNING MOMENT</span><div className="lp-certificate-seal">🏅</div><h1>学习表现荣誉证书</h1><p className="lp-certificate-recipient">颁发给 <b>{profile?.name||"盛思婕"}</b></p><p className="lp-certificate-course">{testMode==="final"?"L3 声光电基础 · 总章节挑战":`${mid} · ${modules.find(m=>m.id===mid)?.title||"章节挑战"}`}</p><div className="lp-certificate-score"><strong className="lp-numeric">{total}</strong><span>分</span><i>/ 100</i></div><h2>{total>=90?"优秀表现，真的很棒！":total>=80?"出色完成，继续保持！":"每一次认真作答，都在让你更进一步。"}</h2><p className="lp-certificate-praise">{total>=90?`${profile?.name||"同学"}，你对课程要点的掌握非常扎实。这份高分是认真学习的最好证明，继续带着这份自信闯关吧！`:total>=80?"你已经展现出很好的理解力，稳定地把知识点说出来就是专业成长。下一关也一起加油！":"感谢你认真完成挑战。测评会帮我们找到下一步学习方向，带着收获继续练习，你一定会越来越熟练。"}</p><div className="lp-certificate-footer"><span>医美军校 · 学习陪练</span><b>半小岛 为你加油</b></div><button className="lp-primary lp-certificate-continue" onClick={()=>setView("report")}><DirectionLabel>查看 AI 答题分析</DirectionLabel></button></article></section>}
    {view==="report"&&<section className="lp-content lp-challenge-report">
      <div className="lp-report-header lp-report-pro">
        <img src="/assets/peninsula-companion.webp" alt="半小岛"/><div><span className="lp-kicker">{testMode==="final"?"FINAL REPORT":`${mid} CHALLENGE REPORT`}</span><h1>{passed?(testMode==="final"?"终局通关，专业力已点亮！":canSkipChapter?"一测通关，直接拿章！":"复测成功，本关拿下！"):total>=90?"高分表现，专业度很亮眼！":"你的认真作答，正在变成专业底气"}</h1><p>{passed?"太棒了！你已经清楚表达关键知识点，继续带着这份自信迎接下一关。":total>=90?`拿到 ${total} 分，表现非常出色！AI 发现一处值得再校准的表达，下面一起看看，修正后就离通关更近一步。`:"你已经打下很好的基础，AI 帮你找到下一步最值得补强的要点。每次练习都在进步。"}</p></div>
        <div className={`lp-total ${passed?"pass":""}`}><strong className="lp-numeric">{total}</strong><span>/100</span></div>
      </div>
      {blockers.length>0&&<div className="lp-error">误区：{blockers.join("；")}</div>}
      <div className="lp-report-layout">
        <div>{scores.map((s,i)=><article className="lp-card lp-report-answer" key={s.itemId}><div className="lp-report-card-heading"><h3>{items[i].prompt}</h3><div className="lp-report-score" aria-label={`得分 ${s.total} 分`}><b className="lp-numeric">{s.total}</b><span>分</span></div></div><div className="lp-report-analysis"><div className="lp-report-analysis-label"><Sparkles size={15} strokeWidth={2.4} aria-hidden="true"/><span>AI 分析</span></div><p>{s.feedback.gap}</p></div>{s.missingPoints.length>0&&<div className="lp-missing-guide"><small>本题遗漏要点 · 建议观看位置</small>{s.missingPoints.map(point=>{const target=locateVideoNode(items[i].moduleId,point);return <button key={point} onClick={()=>lesson(items[i].moduleId,target?.[0]||0)}><span>{point}</span><b><span>{items[i].moduleId} · {stageMeta[items[i].moduleId].title}</span><DirectionIcon direction="right" size={16}/></b></button>})}</div>}</article>)}</div>
        <aside className="lp-card lp-next">
          {passed?<><span className="lp-big-medal">🏅</span><h3>{testMode==="final"?"L3 总勋章已获得":"章节勋章已点亮"}</h3><p className="lp-medal-praise">{testMode==="final"?"太棒了！你已经把六个模块的知识串成完整判断框架，这份专业积累值得骄傲。继续把学到的内容转化成客户听得懂的表达！":canSkipChapter?`漂亮通关！课前就能讲清 ${mid} 的关键因果链，说明你的基础很扎实。带着这份自信继续挑战下一关！`:`做得好！你认真补齐了 ${mid} 的知识要点，也把理解讲得更完整了。每一次复测都在让专业表达更稳，继续保持！`}</p><button className="lp-primary" onClick={()=>setView("overview")}><DirectionLabel>返回闯关地图</DirectionLabel></button></>:<><h3>精准补给路线</h3><p>{testMode==="final"?"回到薄弱章节，补齐知识后再次挑战。":"完成视频学习后使用另一组题目复测。"}</p><button className="lp-primary" onClick={()=>lesson(testMode==="final"?(scores.reduce((a,b)=>a.total<=b.total?a:b).moduleId):mid)}><DirectionLabel>回到课程补给</DirectionLabel></button></>}
        </aside>
      </div>
    </section>}
    </>}
  </div>
  <FloatingCompanion name={profile?.name||"同学"} view={view} open={assistantOpen} onOpen={()=>setAssistantOpen(true)}>
    {assistantOpen&&<section className="lp-pet-panel" aria-label="半小岛 AI 助教"><header><img src="/assets/peninsula-companion.webp" alt="半小岛"/><div><b>{profile?.name?`${profile.name}的半小岛`:"半小岛"}</b></div><button aria-label="关闭半小岛对话" onClick={()=>{setAssistantOpen(false);}}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>{guide&&<p className="lp-pet-guide">{guideLoading?"正在准备今日学习建议…":guide}</p>}<div className="lp-pet-messages">{globalMessages.slice(-8).map((m,i)=><article className={m.role} key={i}><p>{m.content}</p></article>)}{globalBusy&&<p>正在结合你的长期学习记录思考…</p>}<div ref={globalChatEnd}/></div><form onSubmit={e=>{e.preventDefault();askGlobal();}}><input value={globalInput} onChange={e=>setGlobalInput(e.target.value)} placeholder="问学习进度、薄弱点或下一步学什么"/><ChatVoiceButton value={globalInput} onChange={setGlobalInput} onSend={()=>askGlobal()} disabled={globalBusy} compact/></form></section>}
  </FloatingCompanion>
 </div>;
}
