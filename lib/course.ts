import type { AssessmentItem, ModuleKnowledge } from "./types";

export const course = {
  id: "L3-SG-01", title: "医美销售必修：声光电基础", version: "1.0.0-demo", durationMinutes: 15,
  disclaimer: "本测评用于学习陪练，不替代正式考试、医学判断或设备操作规范。",
};

export const modules: ModuleKnowledge[] = [
  {
    id: "P1", title: "能量治疗基础", subtitle: "能量怎样变成组织结果", weight: 0.15,
    objective: "解释能量、传递、层次、靶点、组织反应与效果的因果关系。",
    conclusion: "设备输出的是经过控制的能量，组织反应才可能逐步形成结果。",
    anchor: "设备输出后进入组织，经过传播分布并作用于靶点，引发组织反应，最终形成效果",
    requiredPoints: ["设备输出能量而非功效", "能量进入并在组织内传播分布", "到达目标层次不等于有效作用于靶点", "组织产生即时与后续反应", "效果位于因果链末端"],
    keywords: [["能量", "不是效果", "不是功效"], ["进入组织", "传播", "分布"], ["靶点", "到达不等于", "作用谁"], ["组织反应", "修复", "重塑"], ["最终效果", "效果形成", "最后才可能形成效果", "结果", "末端"]],
    misconceptions: ["设备直接输出效果", "能量等于效果", "到达就一定有效"],
    boundary: "不提供具体设备优劣、参数或个体化方案。", review: "P1 05–06｜组织反应与六环能量链",
  },
  {
    id: "P2", title: "光能设备基础", subtitle: "光进入皮肤后发生了什么", weight: 0.20,
    objective: "解释波长、光学去向、吸收体、选择性光热和光作用五问。",
    conclusion: "光只有被特定组织吸收并转化为足够的组织效应，才可能引发目标反应。",
    anchor: "先判断光的类型与传播方式，再看吸收体、控制条件和组织反应",
    requiredPoints: ["波长影响吸收倾向与传播", "反射、散射、透过与吸收", "主要吸收体包括黑色素、血红蛋白和水", "选择性来自波长、能量、脉宽、光斑、冷却等多条件匹配", "吸收后仍需形成组织反应"],
    keywords: [["波长", "吸收倾向"], ["反射", "散射", "透过", "吸收"], ["黑色素", "血红蛋白", "水"], ["脉宽", "光斑", "冷却", "匹配"], ["组织反应", "热作用", "效果"]],
    misconceptions: ["一种波长只对应一种效果", "只影响靶组织", "周围绝对没有影响", "波长越高越好"],
    boundary: "不背参数，不作诊断，不比较品牌，不给出治疗方案。", review: "P2 03–05｜传播、吸收体与选择性光热",
  },
  {
    id: "P3", title: "射频设备基础", subtitle: "电为什么能让组织升温", weight: 0.15,
    objective: "解释射频、组织阻抗、电热转化、电极回路和温度场。",
    conclusion: "高频电流通过组织，在阻抗作用下于组织内部生热。",
    anchor: "从电流来源和回路入手，理解阻抗如何生热，以及组织会产生怎样的反应",
    requiredPoints: ["射频不是普通电流直接打入皮肤", "设备与电极建立电流回路", "组织阻抗使电能转化为热", "电极结构与参数塑造能量路径和温度场", "热过程触发凝固、收缩及后续修复重塑"],
    keywords: [["高频", "射频", "不是普通电流"], ["电极", "回路"], ["阻抗", "生热", "电热转化"], ["路径", "温度场", "参数"], ["凝固", "收缩", "修复", "重塑"]],
    misconceptions: ["直接把热送进皮肤", "普通电流直接打进皮肤", "电极越多越高级", "频率越高温度越高"],
    boundary: "不提供频率优劣、温度阈值、治疗深度或操作手法。", review: "P3 02–04｜射频、回路、阻抗与温度场",
  },
  {
    id: "P4", title: "超声设备基础", subtitle: "声波为什么能作用到深层", weight: 0.15,
    objective: "解释机械波属性、传播衰减、聚焦、焦区反应及频率与深度。",
    conclusion: "机械波穿过沿途组织并在焦区集中能量，焦区反应才可能逐步形成结果。",
    anchor: "从声波来源与传播方式入手，理解聚焦作用和焦区组织反应",
    requiredPoints: ["超声首先是一种机械波", "传播中存在反射、折射、衰减与吸收", "聚焦使能量在目标区域相对集中", "焦区产生局部热或机械作用并触发组织反应", "标称深度不等于个体绝对解剖层次"],
    keywords: [["机械波"], ["传播", "反射", "折射", "衰减", "吸收"], ["聚焦", "集中"], ["焦区", "热作用", "机械作用", "组织反应"], ["标称深度", "个体", "解剖层次"]],
    misconceptions: ["直接产生提拉力", "越深越好", "标称深度适用于所有人", "沿途完全没有能量"],
    boundary: "不提供探头毫米数、能量、打点方式或个体化方案。", review: "P4 03–06｜传播、聚焦、焦区与深度",
  },
  {
    id: "P5", title: "参数与组织反应", subtitle: "同一种能量为什么效果不同", weight: 0.20,
    objective: "从层次、强度、时间、范围、温度和反应理解参数。",
    conclusion: "参数共同塑造能量的时间与空间分布，效果与风险来自同一组织反应链。",
    anchor: "结合作用层次、能量强度、持续时间、范围和温度变化判断组织反应",
    requiredPoints: ["作用层次决定能量到哪里", "强度描述单位区域或体积承受多少能量", "作用时间影响释放快慢与热积累", "连续、点阵、线状、聚焦形成不同空间分布", "温度与维持时间共同影响组织反应", "效果与风险来自同一能量过程"],
    keywords: [["层次", "到哪里"], ["强度", "能量密度", "多少能量"], ["时间", "快慢", "热积累"], ["范围", "连续", "点阵", "线状", "聚焦"], ["温度", "维持"], ["效果与风险", "组织反应", "不是越高越好"]],
    misconceptions: ["参数越高效果越好", "能量调到最大最好", "相同数字就等效", "参数直接决定效果"],
    boundary: "只用于理解参数，不替代医生设置，不提供阈值或处方。", review: "P5 02–08｜参数六问、组织反应与安全窗口",
  },
  {
    id: "P6", title: "设备理解与应用", subtitle: "不同设备为什么各有用处", weight: 0.15,
    objective: "从问题、层次、靶点、能量、反应和角色理解设备差异。",
    conclusion: "设备没有脱离问题的绝对强弱，价值取决于作用链与任务是否匹配。",
    anchor: "从目标问题、作用层次和靶点出发，判断能量作用方式、组织反应与设备角色",
    requiredPoints: ["先把诉求翻译为可描述的问题", "识别问题主要发生的层次", "明确真正需要改变的靶组织", "按传播方式和预期反应匹配能量", "设备承担单项核心或互补角色", "协同需要清晰分工并考虑累计风险"],
    keywords: [["问题", "诉求"], ["层次", "到哪里"], ["靶点", "作用谁"], ["能量", "怎么作用", "传播"], ["角色", "分工", "互补"], ["协同", "累计", "风险"]],
    misconceptions: ["某一设备最强", "万能设备", "越深越好", "项目越多越好", "组合就是叠加"],
    boundary: "不作个体诊断，不推荐项目组合、参数、点位、顺序或间隔。", review: "P6 02–07｜问题、层次、靶点与设备六问",
  },
];

const prompts: Record<string, Array<[AssessmentItem["level"], string, string, number[]]>> = {
  P1: [
    ["recall", "请说出六环能量链的主要环节。", "如果只记住三个环节，你会选哪三个？为什么？", [0,1,2,3,4]],
    ["recall", "课程里的三个“不等于”分别是什么？", "其中哪一个最容易被新人误解？", [0,2,4]],
    ["understand", "为什么设备不能直接输出紧致或祛斑这样的效果？", "请从能量进入组织以后继续解释。", [0,1,2,3,4]],
    ["understand", "能量到达目标层次，为什么仍不代表一定有效？", "层次和靶点分别回答什么问题？", [1,2,3]],
    ["transfer", "客户说治疗一结束效果就已经完成，你会怎样解释？", "请补充即时反应和后续反应的区别。", [3,4]],
    ["transfer", "面对一台陌生设备，你如何用能量链判断宣传是否讲得完整？", "宣传中最常被跳过的是哪一环？", [0,1,2,3,4]],
  ],
  P2: [
    ["recall", "光进入皮肤后主要有哪四种去向？", "哪一种去向最直接关系到靶组织作用？", [1]],
    ["recall", "光作用的三个主要吸收体是什么？", "不同吸收体为什么不能简单对应一个固定效果？", [0,2]],
    ["understand", "为什么波长不能单独决定光治疗效果？", "还有哪些条件共同影响选择性？", [0,3,4]],
    ["understand", "请解释选择性光热作用的基本逻辑。", "为什么选择性不等于周围组织绝对无影响？", [0,2,3,4]],
    ["transfer", "有人说一种波长只对应一种功效，你会如何纠正？", "请把吸收、参数和组织反应连起来。", [0,2,3,4]],
    ["transfer", "面对色素和血管两个不同问题，你会先比较光的哪些条件？", "不用给参数，只说判断框架。", [0,1,2,3]],
  ],
  P3: [
    ["recall", "射频五问包括哪些判断环节？", "其中哪个环节解释了组织为什么发热？", [0,1,2,3,4]],
    ["recall", "单极、双极和多极的差别为什么不只是电极数量？", "它们更重要的差别与什么有关？", [1,3]],
    ["understand", "射频为什么能让组织升温？", "请把回路、阻抗和温度场连起来。", [0,1,2,3]],
    ["understand", "为什么表面温度不能代表所有深层组织温度？", "温度场还受哪些因素影响？", [2,3,4]],
    ["transfer", "有人说射频就是把热打进皮肤，你会怎样纠正？", "热究竟在哪里、怎样产生？", [0,1,2,3]],
    ["transfer", "面对“电极越多越高级”的说法，请给出专业回应。", "比较射频设备应回到哪些维度？", [1,2,3,4]],
  ],
  P4: [
    ["recall", "超声首先是什么类型的能量？", "它进入组织后会经历哪些传播变化？", [0,1]],
    ["recall", "超声五问包括哪些环节？", "哪一环决定能量集中在哪里？", [0,1,2,3,4]],
    ["understand", "看不见的声波为什么能在深层形成作用区？", "请继续解释焦区内发生什么。", [0,1,2,3]],
    ["understand", "为什么标称深度不等于每个人的绝对解剖层次？", "个体差异会影响什么？", [1,2,4]],
    ["transfer", "客户认为超声越深越好，你会怎样回应？", "请回到目标层次与焦区匹配。", [2,3,4]],
    ["transfer", "有人说聚焦意味着沿途组织完全没有能量，请纠正这个说法。", "传播和衰减在这里意味着什么？", [1,2,3]],
  ],
  P5: [
    ["recall", "参数六问分别是什么？", "至少选四个解释它们控制了什么。", [0,1,2,3,4,5]],
    ["recall", "连续、点阵、线状和聚焦描述的是参数的哪个维度？", "这个维度会怎样改变组织反应？", [3,5]],
    ["understand", "同一种能量为什么效果会不一样？", "请把参数、温度、组织反应和结果连成因果链。", [0,1,2,3,4,5]],
    ["understand", "为什么同样的参数数字不能跨设备直接比较？", "组织条件在其中起什么作用？", [0,1,2,4,5]],
    ["transfer", "客户说能量调到最大效果最好，请用参数六问回应。", "请补上效果与风险来自同一过程。", [0,1,2,3,4,5]],
    ["transfer", "如果治疗反应不足，你会如何分析，而不是直接建议加大能量？", "请按系统匹配思路作答。", [0,1,2,3,4,5]],
  ],
  P6: [
    ["recall", "读懂设备六问分别是什么？", "最后一问为什么不是销售定位？", [0,1,2,3,4]],
    ["recall", "光、射频和超声各自最核心的作用逻辑是什么？", "请不要把它们排成强弱等级。", [2,3]],
    ["understand", "为什么没有一台设备能解决所有问题？", "请从问题、层次和靶点继续解释。", [0,1,2,3]],
    ["understand", "协同为什么不等于设备或项目的简单叠加？", "怎样才算有清晰分工？", [0,1,2,4,5]],
    ["transfer", "客户问光、射频、超声哪一个最强，你会怎样回答？", "请用设备六问组织答案。", [0,1,2,3,4]],
    ["transfer", "面对一台陌生设备，你会如何判断它在方案中的角色？", "如果目标和组织反应说不清，应得出什么结论？", [0,1,2,3,4,5]],
  ],
};

export const questionBank: AssessmentItem[] = Object.entries(prompts).flatMap(([moduleId, entries]) =>
  entries.map(([level, prompt, followUp, requiredPointIndexes], index) => ({
    id: `${moduleId}-${level}-${index + 1}`, moduleId, level, prompt, followUp,
    reference: modules.find((m) => m.id === moduleId)?.review ?? moduleId, requiredPointIndexes,
  })),
);

export function selectAssessment(): AssessmentItem[] {
  const preferred: Record<string, AssessmentItem["level"]> = { P1: "understand", P2: "understand", P3: "understand", P4: "understand", P5: "transfer", P6: "transfer" };
  return modules.map((module) => {
    const candidates = questionBank.filter((q) => q.moduleId === module.id && q.level === preferred[module.id]);
    return candidates[Math.floor(Math.random() * candidates.length)];
  });
}

export function getModule(id: string) { return modules.find((m) => m.id === id)!; }
export function getItem(id: string) { return questionBank.find((q) => q.id === id)!; }

export function retrieveModuleContext(moduleId: string, query = "") {
  const module = getModule(moduleId);
  const normalized = query.toLowerCase();
  const relevantPoints = module.requiredPoints
    .map((point, index) => ({
      point,
      index,
      score: [point, ...(module.keywords[index] || [])].reduce(
        (total, term) => total + (normalized.includes(term.toLowerCase()) ? 2 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map((item) => item.point);

  return {
    moduleId: module.id,
    title: module.title,
    objective: module.objective,
    conclusion: module.conclusion,
    anchor: module.anchor,
    relevantPoints,
    misconceptions: module.misconceptions,
    boundary: module.boundary,
    review: module.review,
  };
}

export function retrieveCourseContext(query = "") {
  const normalized = query.toLowerCase();
  return modules
    .map((module) => ({
      module,
      score: [module.title, module.subtitle, module.objective, module.conclusion, module.anchor, ...module.requiredPoints]
        .reduce((total, term) => total + (normalized.includes(term.toLowerCase()) ? 2 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || a.module.id.localeCompare(b.module.id))
    .slice(0, 3)
    .map(({ module }) => ({
      moduleId: module.id,
      title: module.title,
      objective: module.objective,
      conclusion: module.conclusion,
      anchor: module.anchor,
      boundary: module.boundary,
      review: module.review,
    }));
}
