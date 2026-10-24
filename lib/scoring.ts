import { getItem, getModule } from "./course";
import type { ScoreResult } from "./types";

const blockerPatterns: Array<[RegExp, string]> = [
  [/(设备|能量|参数).{0,8}(直接|就是).{0,8}(效果|功效|紧致|祛斑)/, "把设备、能量或参数直接等同于效果"],
  [/(波长|频率|深度|温度|能量|参数).{0,6}(越高越好|越大越好|最大最好|越深越好)/, "把单一参数解释为越高越好"],
  [/(只影响|只伤).{0,8}(靶|目标).{0,12}(绝对|完全|不会).{0,8}(影响|损伤)/, "把光的选择性绝对化"],
  [/(射频).{0,12}(直接把热|普通电流).{0,8}(打进|送进)/, "错误解释射频生热机制"],
  [/(超声).{0,12}(直接提拉|越深越好|所有人.*一样)/, "错误解释超声或标称深度"],
  [/(建议|应该|可以).{0,16}(设置|使用|选择).{0,8}(参数|能量|点位|疗程|项目组合)/, "越过课程边界给出治疗或操作建议"],
];

export function ruleScore(itemId: string, answer: string): ScoreResult {
  const item = getItem(itemId);
  const module = getModule(item.moduleId);
  const normalized = answer.replace(/\s+/g, "").toLowerCase();
  const indexes = item.requiredPointIndexes;
  const hits = indexes.filter((i) => module.keywords[i].some((k) => normalized.includes(k.replace(/\s+/g, "").toLowerCase())));
  const hitPoints = hits.map((i) => module.requiredPoints[i] as string);
  const missingPoints = indexes.filter((i) => !hits.includes(i)).map((i) => module.requiredPoints[i] as string);
  const negationOrCorrection = /(不|非|未|无|并不|并非|不是|不能|不会|不应|避免|纠正)/;
  const blockers = blockerPatterns
    .filter(([pattern]) => {
      const match = normalized.match(pattern);
      return Boolean(match && !negationOrCorrection.test(match[0]));
    })
    .map(([, label]) => label);
  const coverage = indexes.length ? hits.length / indexes.length : 0;
  const pointScores = indexes.map((i, order) => {
    const maxPerPoint = Math.floor(100 / indexes.length) + (order < 100 % indexes.length ? 1 : 0);
    const hit = hits.includes(i);
    return { point: module.requiredPoints[i], score: hit ? Math.round(maxPerPoint) : 0, maxScore: Math.round(maxPerPoint), evidence: hit ? `回答中命中了相关关键词` : "未找到支持该要点的内容" };
  });
  const total = pointScores.reduce((sum, p) => sum + p.score, 0);
  const tags = [
    ...(coverage < 0.6 ? [`要点覆盖不足→${module.id}`] : []),
    ...(coverage < 1 ? [`答案要点遗漏→${module.id}`] : []),
    ...blockers.map(() => `关键误区→${module.id}`),
  ];
  const followUpNeeded = total < 85 || missingPoints.length > 0 || blockers.length > 0;
  return {
    itemId, moduleId: item.moduleId, total, pointCoverage: Math.round(coverage * 100), pointScores, hitPoints, missingPoints,
    errorStatements: blockers.length ? [answer] : [], blockers,
    evidence: hitPoints.map((point) => `回答已覆盖：${point}`), tags,
    feedback: {
      correct: hitPoints.length ? `你已经说清了：${hitPoints.slice(0, 3).join("、")}。` : "你已经开始回应问题，但暂未命中课程的核心判断点。",
      gap: missingPoints.length ? `还缺少：${missingPoints.slice(0, 3).join("、")}。` : blockers.length ? `需要纠正关键误区：${blockers.join("、")}。` : "核心因果链已经较完整。",
      next: `建议回看 ${module.review}，再用“${module.anchor}”重新组织一次答案。`,
    },
    followUpNeeded, followUp: item.followUp, mode: "rules",
  };
}

export function summarize(scores: ScoreResult[]) {
  // Normalize against the modules represented in this sitting. A single-module
  // lesson test must still be scored out of 100, while a full-course test keeps
  // the course weights.
  const weightTotal = scores.reduce((sum, score) => sum + getModule(score.moduleId).weight, 0);
  const weighted = scores.reduce((sum, score) => sum + score.total * getModule(score.moduleId).weight, 0);
  const total = weightTotal ? Math.round(weighted / weightTotal) : 0;
  const blockers = scores.flatMap((s) => s.blockers.map((b) => `${s.moduleId}：${b}`));
  let level = total >= 85 ? "优秀" : total >= 70 ? "通过" : total >= 60 ? "待补练" : "未通过";
  if (blockers.length && total >= 70) level = "待补练";
  const canSkipChapter = scores.length >= 3 && scores.every(s => s.total >= 80) && !blockers.length;
  return { total, level, blockers, canSkipChapter };
}

export function getPreTestDiagnosis(scores: ScoreResult[]) {
  const allPassed = scores.every(s => s.total >= 80) && scores.every(s => s.blockers.length === 0);
  const diagnosis = scores
    .filter(s => s.missingPoints.length > 0 || s.blockers.length > 0)
    .flatMap(s => [
      ...s.missingPoints.slice(0, 2).map(p => `缺少：${p}`),
      ...s.blockers.slice(0, 1).map(b => `误区：${b}`)
    ]);
  return { allPassed, diagnosis: diagnosis.slice(0, 3) };
}
