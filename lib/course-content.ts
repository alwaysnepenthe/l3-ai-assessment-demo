import { getModule, modules } from "./course";

export type CourseNode = { ratio: number; label: string };
export type PublishedCourseContent = {
  moduleId: string;
  title: string;
  videoUrl?: string;
  fileName?: string;
  guide: string;
  nodes: CourseNode[];
  status: "draft" | "published";
  version: number;
  updatedAt: string;
  updatedBy: string;
  corpusCount: number;
  corpus?: Array<{ id:string; tag:string; quote:string; source:string; sourceFile:string; location:string; scene:string; essence:string; usageIdea:string; score:number; status:"reviewed"|"pending"; reward:string; extractedAt:string }>;
};

export type CourseContentManifest = {
  courseId: string;
  updatedAt: string;
  modules: Record<string, PublishedCourseContent>;
};

const fallbackNodes: Record<string, CourseNode[]> = {
  P1: [{ ratio: .08, label: "能量是什么" }, { ratio: .25, label: "能量传播与分布" }, { ratio: .43, label: "目标层次与靶点" }, { ratio: .64, label: "即时与后续反应" }, { ratio: .84, label: "六环能量链" }],
  P2: [{ ratio: .08, label: "光进入皮肤后的去向" }, { ratio: .28, label: "波长与传播" }, { ratio: .48, label: "组织吸收体" }, { ratio: .69, label: "选择性光热作用" }, { ratio: .88, label: "光作用五问" }],
  P3: [{ ratio: .08, label: "射频设备与电极" }, { ratio: .27, label: "电流回路" }, { ratio: .48, label: "组织阻抗与生热" }, { ratio: .68, label: "温度场形成" }, { ratio: .88, label: "射频五问与组织反应" }],
  P4: [{ ratio: .08, label: "超声作为机械波传播" }, { ratio: .28, label: "传播中的反射与衰减" }, { ratio: .5, label: "聚焦与能量集中" }, { ratio: .7, label: "焦区组织反应" }, { ratio: .88, label: "标称深度与个体差异" }],
  P5: [{ ratio: .06, label: "参数与组织反应" }, { ratio: .22, label: "作用层次与强度" }, { ratio: .42, label: "时间和能量分布" }, { ratio: .62, label: "范围与温度" }, { ratio: .82, label: "效果与风险" }],
  P6: [{ ratio: .08, label: "从诉求识别问题" }, { ratio: .28, label: "判断问题层次与靶组织" }, { ratio: .5, label: "匹配能量与组织反应" }, { ratio: .7, label: "设备核心任务" }, { ratio: .88, label: "设备协同与风险边界" }],
};

const existingVideos: Record<string, string> = { P1: "/videos/l3-p1.mp4", P2: "/videos/l3-p2.mp4", P3: "/videos/l3-p3.mp4", P5: "/videos/l3-p5.mp4" };

export function createDefaultManifest(): CourseContentManifest {
  const updatedAt = new Date().toISOString();
  return {
    courseId: "L3-SG-01",
    updatedAt,
    modules: Object.fromEntries(modules.map((module) => [module.id, {
      moduleId: module.id,
      title: module.title,
      videoUrl: existingVideos[module.id],
      fileName: existingVideos[module.id]?.split("/").pop(),
      guide: `这一节的核心是${module.conclusion}记住主线：${module.anchor}学习时特别留意：${module.requiredPoints.slice(0, 3).join("、")}。`,
      nodes: fallbackNodes[module.id] || [],
      status: existingVideos[module.id] ? "published" : "draft",
      version: 1,
      updatedAt,
      updatedBy: "盛思婕",
      corpusCount: module.requiredPoints.length + module.misconceptions.length,
    }])),
  };
}

export function deterministicGeneration(moduleId: string) {
  const module = getModule(moduleId);
  return {
    guide: `本节围绕“${module.objective}”展开。先建立主线：${module.anchor}。${module.conclusion}观看时请重点辨析“${module.misconceptions.slice(0, 2).join("”和“")}”这两类常见误区。`,
    nodes: fallbackNodes[moduleId] || module.requiredPoints.slice(0, 5).map((label, index) => ({ ratio: .1 + index * .18, label })),
  };
}

