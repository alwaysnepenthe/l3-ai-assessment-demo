"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Database,
  FileText,
  LayoutDashboard,
  Library,
  MessageSquareQuote,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import {
  COURSE_MANIFEST_KEY,
  saveCourseVideo,
} from "@/lib/client-course-store";
import {
  analyzeCourseText,
  parseCourseFile,
  type ParsedCourseFile,
} from "@/lib/course-file-parser";

type NodeItem = { ratio: number; label: string };
type CorpusEntry = {
  id: string;
  tag: string;
  quote: string;
  source: string;
  sourceFile: string;
  location: string;
  scene: string;
  essence: string;
  usageIdea: string;
  score: number;
  status: "reviewed" | "pending";
  reward: string;
  extractedAt: string;
};
type CourseItem = {
  moduleId: string;
  title: string;
  videoUrl?: string;
  fileName?: string;
  guide: string;
  nodes: NodeItem[];
  status: "draft" | "published";
  version: number;
  updatedAt: string;
  updatedBy: string;
  corpusCount: number;
  corpus?: CorpusEntry[];
};
type Manifest = {
  courseId: string;
  updatedAt: string;
  modules: Record<string, CourseItem>;
};
type Tab = "dashboard" | "courses" | "upload" | "corpus" | "publish";

const nav: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: "dashboard", label: "运营总览", icon: LayoutDashboard },
  { id: "courses", label: "课程管理", icon: Library },
  { id: "upload", label: "课程上传", icon: UploadCloud },
  { id: "corpus", label: "语料中心", icon: MessageSquareQuote },
  { id: "publish", label: "发布记录", icon: BookOpenCheck },
];

const sampleQuotes = [
  {
    id: "seed-p1-01",
    tag: "核心结论",
    quote: "设备输出的是能量，不是功效。",
    source: "P1 能量治疗基础",
    sourceFile: "P1 能量治疗基础课程脚本.docx",
    location: "第 2 页 · 能量定义",
    scene: "客户将设备参数直接等同于效果时",
    essence: "用一句话切断“设备＝功效”的错误因果，把沟通焦点重新拉回能量进入组织后的完整作用链。",
    usageIdea: "用于销售开场校准认知；AI 陪练可将它作为判断回答是否混淆设备、能量与效果的基准句。",
    score: 98,
    status: "reviewed" as const,
    reward: "已计入贡献值 +20",
    extractedAt: "2026-10-24 16:20",
  },
  {
    id: "seed-p1-02",
    tag: "金句",
    quote: "到达不等于有效，有效还要看能量最终作用于谁。",
    source: "P1 能量治疗基础",
    sourceFile: "P1 讲师授课转写.txt",
    location: "03:18 · 靶点作用",
    scene: "解释同一设备在不同组织层次的差异",
    essence: "把“到达”和“有效作用”拆成两个判断步骤，强化靶点是效果形成的必要条件。",
    usageIdea: "用于客户追问“能量已经打到为什么还没效果”时；也可生成靶点判断类场景题。",
    score: 94,
    status: "reviewed" as const,
    reward: "已计入贡献值 +16",
    extractedAt: "2026-10-24 16:22",
  },
  {
    id: "seed-p5-01",
    tag: "常见误区",
    quote: "参数不是越高越好，而是与层次、时间、范围和组织反应匹配。",
    source: "P5 参数与组织反应",
    sourceFile: "P5 参数与组织反应.pdf",
    location: "第 6 页 · 参数平衡",
    scene: "客户追问能量越高效果是否越好时",
    essence: "把单一参数高低改写为多变量匹配问题，建立专业、克制且具安全边界的表达。",
    usageIdea: "用于高能量诉求的异议处理；知识库检索命中后，提示销售从层次、时间、范围和反应四方面回答。",
    score: 92,
    status: "reviewed" as const,
    reward: "已计入贡献值 +15",
    extractedAt: "2026-10-24 17:05",
  },
  {
    id: "seed-p2-01", tag: "通俗比喻", quote: "波长像地址，吸收体像收件人；地址和收件人匹配，能量才更集中。", source: "P2 光能设备基础", sourceFile: "P2 光学基础培训视频.mp4", location: "01:57 · 波长与传播", scene: "向零基础客户解释选择性吸收", essence: "用地址与收件人的日常关系解释波长和吸收体，降低光学概念的理解门槛。", usageIdea: "用于新人话术模板和 AI 通俗解释；回答过度专业时，可推荐这条比喻进行二次表达。", score: 96, status: "reviewed" as const, reward: "已计入贡献值 +18", extractedAt: "2026-10-23 14:10",
  },
  {
    id: "seed-p3-01", tag: "销售表达", quote: "射频不是把热送进去，而是让电流经过组织后在目标区域形成可控温度场。", source: "P3 射频设备基础", sourceFile: "P3 射频设备内部培训.md", location: "第 4 节 · 阻抗与生热", scene: "纠正客户对射频加热方式的误解", essence: "将错误的“外部送热”改为“电流—阻抗—生热”的机制链，同时保留客户可理解的语言。", usageIdea: "用于射频项目机制讲解；AI 可依据它检查回答中是否提到回路、阻抗和温度场。", score: 95, status: "reviewed" as const, reward: "已计入贡献值 +18", extractedAt: "2026-10-23 15:40",
  },
  {
    id: "seed-p4-01", tag: "风险边界", quote: "聚焦描述的是能量分布方式，不代表所有人的实际作用层次完全相同。", source: "P4 超声设备基础", sourceFile: "P4 超声课程讲师手册.docx", location: "第 8 页 · 焦区边界", scene: "回应客户对标称深度的绝对化理解", essence: "区分设备标称信息与个体实际作用，避免把深度标签当成确定结果。", usageIdea: "用于合规边界提醒和风险话术；AI 陪练遇到绝对化承诺时引用该原则进行纠偏。", score: 91, status: "pending" as const, reward: "待审核后发放", extractedAt: "2026-10-25 09:15",
  },
];

function extractCorpus(text: string, moduleId: string, title: string, sourceFile: string): CorpusEntry[] {
  const sentences = text.split(/(?<=[。！？!?])/).map(item => item.trim()).filter(item => item.length >= 18 && item.length <= 120);
  return sentences.slice(0, 6).map((quote, index) => ({
    id: `${moduleId}-${Date.now()}-${index}`,
    tag: /不是|不等于|误区|避免/.test(quote) ? "常见误区" : /客户|表达|解释/.test(quote) ? "销售表达" : index === 0 ? "核心结论" : "知识精华",
    quote,
    source: `${moduleId} ${title}`,
    sourceFile,
    location: `原始资料 · 第 ${index + 1} 个有效片段`,
    scene: /参数|能量/.test(quote) ? "客户询问设备参数与效果关系时" : /组织|层次|靶点/.test(quote) ? "解释作用层次与组织反应时" : "课程讲解与客户沟通复述",
    essence: /不是|不等于|误区|避免/.test(quote) ? "这段内容能够直接纠正常见错误认知，并为后续专业解释建立清晰边界。" : "这段内容压缩了课程中的关键因果关系，适合被销售快速记忆和复述。",
    usageIdea: /参数|能量/.test(quote) ? "纳入异议处理话术与 AI 场景陪练，在客户追问参数、能量或效果时作为回答依据。" : "纳入课程导览、知识库召回和新人复述训练，帮助把专业知识转化为客户语言。",
    score: Math.max(86, 97 - index * 2),
    status: index < 3 ? "reviewed" : "pending",
    reward: index < 3 ? `已计入贡献值 +${18 - index * 2}` : "待审核后发放",
    extractedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
  }));
}

export default function AdminConsole() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selected, setSelected] = useState("P4");
  const [file, setFile] = useState<File | null>(null);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [parsedMaterial, setParsedMaterial] = useState<ParsedCourseFile | null>(
    null,
  );
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    mode: string;
    content: CourseItem;
  } | null>(null);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const materialInput = useRef<HTMLInputElement>(null);
  const materialParseId = useRef(0);

  useEffect(() => {
    const requested = window.location.hash.replace("#", "") as Tab;
    if (nav.some(item => item.id === requested)) setTab(requested);
  }, []);

  function removeVideo() {
    setFile(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function parseSelectedMaterial(next: File | null) {
    const parseId = ++materialParseId.current;
    setMaterialFile(next);
    setParsedMaterial(null);
    setError("");
    if (!next) {
      setParsing(false);
      return;
    }

    setParsing(true);
    try {
      const parsed = await parseCourseFile(next);
      if (parseId === materialParseId.current) setParsedMaterial(parsed);
    } catch (reason) {
      if (parseId === materialParseId.current) {
        setError(
          reason instanceof Error ? reason.message : "课程资料解析失败",
        );
      }
    } finally {
      if (parseId === materialParseId.current) setParsing(false);
    }
  }

  function removeMaterial() {
    void parseSelectedMaterial(null);
    if (materialInput.current) materialInput.current.value = "";
  }

  useEffect(() => {
    const controller = new AbortController();
    async function loadCourses() {
      const response = await fetch("/api/admin/courses", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) return;
      const base = (await response.json()) as Manifest;
      let next = base;
      try {
        const local = JSON.parse(
          localStorage.getItem(COURSE_MANIFEST_KEY) || "null",
        ) as Manifest | null;
        if (local) {
          next = {
            ...base,
            ...local,
            modules: { ...base.modules, ...local.modules },
          };
        }
      } catch {
        // Fall back to the server manifest when local data is unavailable.
      }
      if (!controller.signal.aborted) setManifest(next);
    }
    loadCourses().catch(() => {
      if (!controller.signal.aborted) setError("暂时无法读取课程数据");
    });
    return () => controller.abort();
  }, []);

  const courses = useMemo(
    () => Object.values(manifest?.modules || {}),
    [manifest],
  );
  const published = courses.filter(
    (item) => item.status === "published",
  ).length;
  const withVideo = courses.filter((item) => item.videoUrl).length;
  const corpusTotal = courses.reduce((sum, item) => sum + item.corpusCount, 0);

  async function upload() {
    if ((!file && !parsedMaterial) || uploading) return;
    setUploading(true);
    setProgress(0);
    setError("");
    setResult(null);
    try {
      setProgress(18);
      if (file) await saveCourseVideo(selected, file);
      setProgress(58);
      const response = await fetch("/api/admin/courses/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: selected, transcript: parsedMaterial?.text || "" }),
      });
      const generated = (await response.json()) as {
        error?: string;
        mode: string;
        guide: string;
        nodes: NodeItem[];
      };
      if (!response.ok) throw new Error(generated.error || "AI 生成失败");
      setProgress(84);
      const now = new Date().toISOString();
      const previous = manifest?.modules[selected];
      const localAnalysis = parsedMaterial
        ? analyzeCourseText(parsedMaterial.text)
        : null;
      const content: CourseItem = {
        moduleId: selected,
        title: previous?.title || selected,
        videoUrl: file ? `indexeddb://${selected}` : previous?.videoUrl,
        fileName: file?.name || previous?.fileName,
        guide: localAnalysis?.guide || generated.guide,
        nodes: localAnalysis?.nodes || generated.nodes,
        status: "published",
        version: (previous?.version || 0) + 1,
        updatedAt: now,
        updatedBy: "盛思婕",
        corpus: parsedMaterial
          ? [...(previous?.corpus || []), ...extractCorpus(parsedMaterial.text, selected, previous?.title || selected, materialFile?.name || "课程资料")]
          : previous?.corpus || [],
        corpusCount: (previous?.corpusCount || 0) + (parsedMaterial ? Math.max(1, Math.ceil(parsedMaterial.paragraphs / 5)) : 0),
      };
      const next: Manifest = {
        courseId: manifest?.courseId || "L3-SG-01",
        updatedAt: now,
        modules: { ...(manifest?.modules || {}), [selected]: content },
      };
      localStorage.setItem(COURSE_MANIFEST_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("peninsula-course-published", { detail: { moduleId: selected, version: content.version } }));
      try { const channel = new BroadcastChannel("peninsula-course-sync"); channel.postMessage({ type: "course-published", moduleId: selected, version: content.version }); channel.close(); } catch {}
      setManifest(next);
      setProgress(100);
      setResult({ mode: generated.mode, content });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>半</span>
          <div>
            <b>课程智慧中台</b>
            <small>CONTENT INTELLIGENCE</small>
          </div>
        </div>
        <div className="admin-nav-label">工作台</div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => { setTab(item.id); window.history.replaceState(null, "", `#${item.id}`); }}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.id === "upload" && <i>LIVE</i>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div>
            <Database size={16} />
            <span>
              <b>学员端同步服务</b>
              <small>数据通道正常</small>
            </span>
            <em />
          </div>
          <a href="/" target="_blank">
            打开学员端 <ChevronRight size={14} />
          </a>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <small>半岛医疗 / 黄埔军校</small>
            <b>{nav.find((item) => item.id === tab)?.label}</b>
          </div>
          <div className="admin-top-actions">
            <label>
              <Search size={15} />
              <input placeholder="搜索课程、语料或版本" />
            </label>
            <button aria-label="设置">
              <Settings size={18} />
            </button>
            <div className="admin-user">
              <span>盛</span>
              <div>
                <b>盛思婕</b>
                <small>课程运营管理员</small>
              </div>
            </div>
          </div>
        </header>
        <div className="admin-body">
          {tab === "dashboard" && (
            <Dashboard
              courses={courses}
              published={published}
              withVideo={withVideo}
              corpusTotal={corpusTotal}
              onUpload={() => setTab("upload")}
            />
          )}
          {tab === "courses" && (
            <CourseTable
              courses={courses}
              onUpload={(id) => {
                setSelected(id);
                setTab("upload");
              }}
            />
          )}
          {tab === "upload" && (
            <UploadPanel
              courses={courses}
              selected={selected}
              setSelected={setSelected}
              file={file}
              materialFile={materialFile}
              parsedMaterial={parsedMaterial}
              parsing={parsing}
              uploading={uploading}
              progress={progress}
              result={result}
              error={error}
              choose={() => fileInput.current?.click()}
              chooseMaterial={() => materialInput.current?.click()}
              removeMaterial={removeMaterial}
              removeVideo={removeVideo}
              upload={upload}
            />
          )}
          {tab === "corpus" && <CorpusCenter corpusTotal={corpusTotal} courses={courses} />}
          {tab === "publish" && <PublishHistory courses={courses} />}
        </div>
      </main>
      <input
        ref={fileInput}
        hidden
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />
      <input
        ref={materialInput}
        hidden
        type="file"
        accept=".txt,.md,.markdown,.docx,.pdf,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(event) => {
          const next = event.target.files?.[0] || null;
          event.currentTarget.value = "";
          void parseSelectedMaterial(next);
        }}
      />
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-page-intro">
      <div>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}

function Dashboard({
  courses,
  published,
  withVideo,
  corpusTotal,
  onUpload,
}: {
  courses: CourseItem[];
  published: number;
  withVideo: number;
  corpusTotal: number;
  onUpload: () => void;
}) {
  const cards = [
    {
      label: "课程小节",
      value: courses.length || 6,
      note: "L3 课程包",
      icon: Library,
    },
    {
      label: "已上线视频",
      value: withVideo,
      note: `覆盖率 ${Math.round((withVideo / 6) * 100)}%`,
      icon: Video,
    },
    {
      label: "AI 导览已发布",
      value: published,
      note: "同步至学员端",
      icon: WandSparkles,
    },
    {
      label: "知识语料",
      value: corpusTotal,
      note: "条可检索内容",
      icon: Database,
    },
  ];
  return (
    <>
      <PageIntro
        eyebrow="OPERATIONS OVERVIEW"
        title="课程内容运营总览"
        copy="从原始课程到 AI 学习内容，统一管理、审核与发布。"
        action={
          <button className="admin-primary" onClick={onUpload}>
            <UploadCloud size={16} />
            上传新课程
          </button>
        }
      />
      <section className="admin-stat-grid">
        {cards.map((card) => (
          <article key={card.label}>
            <div>
              <card.icon size={18} />
            </div>
            <small>{card.label}</small>
            <strong>{card.value}</strong>
            <p>
              <span>●</span>
              {card.note}
            </p>
          </article>
        ))}
      </section>
      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-pipeline">
          <header>
            <div>
              <small>CONTENT PIPELINE</small>
              <h2>内容生产链路</h2>
            </div>
            <span className="admin-health">
              <i />
              服务正常
            </span>
          </header>
          <div className="pipeline-steps">
            {[
              [UploadCloud, "原始课程", "视频与脚本入库"],
              [FileText, "语料解析", "知识点与金句提取"],
              [Sparkles, "AI 内容加工", "导览与关键节点"],
              [CheckCircle2, "审核发布", "更新至学员端"],
            ].map(([Icon, title, copy], index) => (
              <div key={String(title)}>
                <span>
                  <Icon size={18} />
                </span>
                <b>{title as string}</b>
                <small>{copy as string}</small>
                {index < 3 && <ChevronRight size={15} />}
              </div>
            ))}
          </div>
        </article>
        <article className="admin-panel admin-quality">
          <header>
            <div>
              <small>QUALITY CONTROL</small>
              <h2>内容质量</h2>
            </div>
            <CircleGauge size={22} />
          </header>
          <div className="quality-score">
            <strong>94</strong>
            <span>/100</span>
          </div>
          <p>课程内容可追溯度良好</p>
          <ul>
            <li>
              <span>知识点覆盖</span>
              <b>96%</b>
            </li>
            <li>
              <span>脚本来源标注</span>
              <b>100%</b>
            </li>
            <li>
              <span>合规边界校验</span>
              <b>88%</b>
            </li>
          </ul>
        </article>
      </section>
      <section className="admin-panel admin-recent">
        <header>
          <div>
            <small>RECENT COURSES</small>
            <h2>近期课程状态</h2>
          </div>
          <button>
            查看全部 <ChevronRight size={14} />
          </button>
        </header>
        <CourseRows courses={courses.slice(0, 4)} onUpload={onUpload} />
      </section>
    </>
  );
}

function CourseRows({
  courses,
  onUpload,
}: {
  courses: CourseItem[];
  onUpload: (id: string) => void;
}) {
  return (
    <div className="admin-course-rows">
      {courses.map((item) => (
        <div key={item.moduleId}>
          <span className="course-code">{item.moduleId}</span>
          <div className="course-info">
            <b>{item.title}</b>
            <small>{item.fileName || "暂未上传视频"}</small>
          </div>
          <span className={`status ${item.status}`}>
            {item.status === "published" ? "已发布" : "待完善"}
          </span>
          <span className="version">V{item.version}.0</span>
          <span className="date">
            {new Date(item.updatedAt).toLocaleDateString("zh-CN")}
          </span>
          <button onClick={() => onUpload(item.moduleId)}>
            {item.videoUrl ? "更新" : "上传"}
          </button>
        </div>
      ))}
    </div>
  );
}

function CourseTable({
  courses,
  onUpload,
}: {
  courses: CourseItem[];
  onUpload: (id: string) => void;
}) {
  return (
    <>
      <PageIntro
        eyebrow="COURSE MANAGEMENT"
        title="课程管理"
        copy="统一管理视频、AI 导览、关键节点与发布版本。"
      />
      <section className="admin-panel admin-course-library">
        <div className="library-toolbar">
          <div>
            <button className="active">L3 声光电基础</button>
            <button>L1–L7 全部课程</button>
          </div>
          <span>6 个小节</span>
        </div>
        <CourseRows courses={courses} onUpload={onUpload} />
      </section>
    </>
  );
}

function UploadPanel(props: {
  courses: CourseItem[];
  selected: string;
  setSelected: (id: string) => void;
  file: File | null;
  materialFile: File | null;
  parsedMaterial: ParsedCourseFile | null;
  parsing: boolean;
  uploading: boolean;
  progress: number;
  result: { mode: string; content: CourseItem } | null;
  error: string;
  choose: () => void;
  chooseMaterial: () => void;
  removeMaterial: () => void;
  removeVideo: () => void;
  upload: () => void;
}) {
  const current = props.courses.find(
    (item) => item.moduleId === props.selected,
  );
  return (
    <>
      <PageIntro
        eyebrow="AI COURSE INGESTION"
        title="上传课程并生成学习内容"
        copy="上传课程资料与视频，系统读取文件内容并生成课程导览、关键节点和可检索语料。"
      />
      <div className="admin-upload-layout">
        <section className="admin-panel upload-form">
          <div className="form-step">
            <span>01</span>
            <div>
              <b>选择目标课程</b>
              <small>上传内容将关联到对应小节</small>
            </div>
          </div>
          <div className="course-select-grid">
            {props.courses.map((item) => (
              <button
                key={item.moduleId}
                className={props.selected === item.moduleId ? "active" : ""}
                onClick={() => props.setSelected(item.moduleId)}
              >
                <span>{item.moduleId}</span>
                <div>
                  <b>{item.title}</b>
                  <small>
                    {item.videoUrl ? `当前 V${item.version}.0` : "待上传"}
                  </small>
                </div>
                <CheckCircle2 size={16} />
              </button>
            ))}
          </div>
          <div className="form-step">
            <span>02</span>
            <div>
              <b>上传课程视频</b>
              <small>MP4、MOV 或 WebM，推荐 1080P</small>
            </div>
          </div>
          <div className="video-upload-wrap"><button className={`dropzone ${props.file ? "has-file" : ""}`} onClick={props.choose}>
            <span>
              <UploadCloud size={25} />
            </span>
            {props.file ? (
              <>
                <b>{props.file.name}</b>
                <small>
                  {(props.file.size / 1024 / 1024).toFixed(1)} MB · 点击更换文件
                </small>
              </>
            ) : (
              <>
                <b>点击选择课程视频</b>
                <small>文件将保存到课程媒体库</small>
              </>
            )}
          </button>{props.file&&<button type="button" className="video-remove" onClick={props.removeVideo} disabled={props.uploading} aria-label="移除课程视频"><X size={18}/></button>}</div>
          <div className="form-step material-step">
            <span>03</span>
            <div>
              <b>上传课程资料</b>
              <small>TXT、Markdown、DOCX 或 PDF，上传后自动提取课程内容</small>
            </div>
          </div>
          <div
            className={`material-dropzone ${props.parsedMaterial ? "parsed" : ""}`}
            aria-busy={props.parsing}
          >
            <button
              type="button"
              className="material-file-select"
              onClick={props.chooseMaterial}
              disabled={props.parsing || props.uploading}
            >
              <span><FileText size={21} /></span>
              <div>
                <b>
                  {props.parsing
                    ? "正在解析课程资料…"
                    : props.materialFile?.name || "点击选择课程脚本或转写文件"}
                </b>
                <small>
                  {props.parsedMaterial
                    ? `已解析 ${props.parsedMaterial.characters.toLocaleString()} 字 · ${props.parsedMaterial.paragraphs} 个段落${props.parsedMaterial.pages ? ` · ${props.parsedMaterial.pages} 页` : ""} · 点击更换`
                    : props.materialFile
                      ? "解析未完成，可移除后重新选择"
                      : "支持 TXT、Markdown、DOCX、PDF，上传后自动解析"}
                </small>
              </div>
              {props.parsedMaterial && <CheckCircle2 size={18} />}
            </button>
            {props.materialFile && (
              <button
                type="button"
                className="material-remove"
                onClick={props.removeMaterial}
                disabled={props.uploading}
                aria-label="移除课程资料"
                title="移除文件"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {props.uploading && (
            <div className="upload-progress">
              <div>
                <span>AI 正在处理课程…</span>
                <b>{props.progress}%</b>
              </div>
              <i>
                <em style={{ width: `${props.progress}%` }} />
              </i>
              <small>
                {props.progress < 72
                  ? "正在上传视频"
                  : "正在生成导览与关键节点"}
              </small>
            </div>
          )}
          {props.error && <p className="upload-error">{props.error}</p>}
          <button
            className="admin-primary upload-submit"
            disabled={(!props.file && !props.parsedMaterial) || props.uploading || props.parsing}
            onClick={props.upload}
          >
            <WandSparkles size={17} />
            {props.uploading ? "AI 正在加工…" : "上传、生成并发布"}
          </button>
        </section>
        <aside className="admin-upload-side">
          <article className="admin-panel process-card">
            <small>AUTOMATION</small>
            <h3>本次将自动完成</h3>
            {[
              [Video, "视频入库", "生成可访问的课程媒体"],
              [FileText, "文件解析", "读取 DOCX、PDF 与文本资料"],
              [Sparkles, "AI 导览", "提炼一段课前导览"],
              [Clock3, "关键节点", "生成 5 个快速定位点"],
              [CheckCircle2, "同步发布", "更新学员端课堂"],
            ].map(([Icon, title, copy]) => (
              <div key={String(title)}>
                <span>
                  <Icon size={16} />
                </span>
                <p>
                  <b>{title as string}</b>
                  <small>{copy as string}</small>
                </p>
              </div>
            ))}
          </article>
          {props.result ? (
            <article className="admin-panel generated-preview">
              <div className="success-title">
                <CheckCircle2 size={20} />
                <div>
                  <b>发布成功</b>
                  <small>
                    {props.result.mode === "ai"
                      ? "AI 模型生成"
                      : "课程知识模型生成"}
                  </small>
                </div>
              </div>
              <h3>
                {props.result.content.moduleId} · {props.result.content.title}
              </h3>
              <p>{props.result.content.guide}</p>
              <div className="preview-nodes">
                {props.result.content.nodes.map((node, index) => (
                  <span key={node.label}>
                    <i>{String(index + 1).padStart(2, "0")}</i>
                    {node.label}
                  </span>
                ))}
              </div>
              <a
                href={`/?module=${props.result.content.moduleId}`}
                target="_blank"
              >
                前往学员端验证 <ChevronRight size={14} />
              </a>
            </article>
          ) : (
            <article className="admin-panel current-version">
              <small>CURRENT VERSION</small>
              <h3>
                {props.selected} · {current?.title || "课程"}
              </h3>
              <div>
                <span>版本</span>
                <b>V{current?.version || 0}.0</b>
              </div>
              <div>
                <span>视频</span>
                <b>{current?.videoUrl ? "已上线" : "未上传"}</b>
              </div>
              <div>
                <span>学员端</span>
                <b>{current?.status === "published" ? "已同步" : "待发布"}</b>
              </div>
            </article>
          )}
        </aside>
      </div>
    </>
  );
}

function CorpusCenter({ corpusTotal, courses }: { corpusTotal: number; courses: CourseItem[] }) {
  const uploaded = courses.flatMap(item => item.corpus || []);
  const entries = [...uploaded, ...sampleQuotes];
  const reviewed = entries.filter(item => item.status === "reviewed").length;
  const sources = new Set(entries.map(item => item.sourceFile)).size;
  return (
    <>
      <PageIntro
        eyebrow="KNOWLEDGE CORPUS"
        title="语料中心"
        copy="将课程脚本、精彩表达、知识结论与常见误区沉淀为可检索内容。"
      />
      <section className="corpus-summary">
        <div>
          <Database size={22} />
          <span>
            <small>可检索语料</small>
            <b>{corpusTotal}</b>
          </span>
        </div>
        <div>
          <MessageSquareQuote size={22} />
          <span>
            <small>精彩语料</small>
            <b>{entries.length}</b>
          </span>
        </div>
        <div>
          <CheckCircle2 size={22} />
          <span>
            <small>来源文件</small>
            <b>{sources}</b>
          </span>
        </div>
      </section>
      <section className="corpus-flow">
        <div><span>01</span><b>原始课程</b><small>视频、讲师脚本、PDF 与转写</small></div><i>→</i>
        <div><span>02</span><b>片段定位</b><small>保留文件名、页码或时间点</small></div><i>→</i>
        <div><span>03</span><b>精华提炼</b><small>结论、金句、误区与销售表达</small></div><i>→</i>
        <div><span>04</span><b>审核入库</b><small>{reviewed}/{entries.length} 条已可供 AI 检索</small></div>
      </section>
      <section className="admin-panel corpus-panel">
        <header>
          <div>
            <small>HIGHLIGHT EXTRACTION</small>
            <h2>精彩语料提取</h2>
          </div>
          <button className="admin-secondary">
            <Sparkles size={15} /> AI 批量提取
          </button>
        </header>
        <div className="quote-list">
          {entries.map((item) => (
            <article key={item.id}>
              <div className="quote-card-top"><span>{item.tag}</span><em className={item.status}>{item.status === "reviewed" ? "已审核入库" : "待人工复核"}</em></div>
              <blockquote>“{item.quote}”</blockquote>
              <div className="quote-value"><section><small>精华点</small><p>{item.essence}</p></section><section><small>应用思路</small><p>{item.usageIdea}</p></section></div>
              <div className="quote-trace"><p><b>来源</b><span>{item.sourceFile} · {item.location}</span></p><p><b>场景</b><span>{item.scene}</span></p></div>
              <footer>
                <small>{item.source}</small>
                <b>AI 置信度 {item.score}%</b>
                <button>查看原文</button>
              </footer>
              <div className="quote-reward"><span>{item.reward}</span><time>{item.extractedAt}</time></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function PublishHistory({ courses }: { courses: CourseItem[] }) {
  return (
    <>
      <PageIntro
        eyebrow="RELEASE CONTROL"
        title="发布记录"
        copy="追踪每一次课程内容更新，确保学员端内容可追溯、可回滚。"
      />
      <section className="admin-panel release-list">
        <div className="release-head">
          <span>课程</span>
          <span>发布内容</span>
          <span>版本</span>
          <span>状态</span>
          <span>操作人 / 时间</span>
        </div>
        {courses
          .filter((item) => item.status === "published")
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .map((item) => (
            <div className="release-row" key={item.moduleId}>
              <span>
                <i>{item.moduleId}</i>
                <b>{item.title}</b>
              </span>
              <span>视频 · AI 导览 · {item.nodes.length} 个节点</span>
              <span>V{item.version}.0</span>
              <span className="status published">已同步</span>
              <span>
                {item.updatedBy}
                <small>
                  {new Date(item.updatedAt).toLocaleString("zh-CN")}
                </small>
              </span>
            </div>
          ))}
      </section>
    </>
  );
}
