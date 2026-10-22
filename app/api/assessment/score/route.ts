import { getItem, getModule } from "@/lib/course";
import { ruleScore } from "@/lib/scoring";
import type { ScoreResult } from "@/lib/types";

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("模型未返回 JSON");
  return JSON.parse(match[0]);
}

export async function POST(request: Request) {
  const { itemId, answer } = await request.json() as { itemId: string; answer: string };
  if (!itemId || !answer?.trim()) return Response.json({ error: "缺少题目或回答" }, { status: 400 });
  if (!getItem(itemId)) return Response.json({ error: "题目不存在" }, { status: 404 });
  const fallback = ruleScore(itemId, answer);
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return Response.json(fallback);
  try {
    const item = getItem(itemId);
    const module = getModule(item.moduleId);
    const standardAnswer = item.requiredPointIndexes.map(i => module.requiredPoints[i]).join("；");
    const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4.1-mini", temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "你是严格的课程答案评分器。只比较学员回答与标准答案要点，不按文采、长度或所谓表达能力评分。把100分均分给必答要点，依据语义是否真正回答到逐项给分。必须返回JSON，不得给出治疗建议。" },
          { role: "user", content: JSON.stringify({ question: item.prompt, answer, referenceAnswer: standardAnswer, source: item.reference, requiredPoints: item.requiredPointIndexes.map((i) => module.requiredPoints[i]), forbiddenMisconceptions: module.misconceptions, requiredOutput: { total: "0-100，必须等于pointScores中score之和并取整", pointCoverage: "0-100", pointScores: [{ point: "要点", score: 0, maxScore: 0, evidence: "学员原话证据或未命中原因" }], hitPoints: [], missingPoints: [], errorStatements: [], blockers: [], evidence: [], tags: [], feedback: { correct: "", gap: "", next: "" }, followUpNeeded: true } }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = extractJson(data.choices?.[0]?.message?.content || "");
    const requiredPoints = item.requiredPointIndexes.map(i => module.requiredPoints[i]);
    if (!Array.isArray(parsed.pointScores) || parsed.pointScores.length !== requiredPoints.length) throw new Error("评分要点数量不匹配");
    const pointScores = requiredPoints.map((point, i) => {
      const p = parsed.pointScores[i];
      const maxScore = Math.floor(100 / requiredPoints.length) + (i < 100 % requiredPoints.length ? 1 : 0);
      const fraction = Number(p.maxScore) > 0 ? Number(p.score) / Number(p.maxScore) : 0;
      return { point, score: Math.round(maxScore * Math.max(0, Math.min(1, fraction))), maxScore, evidence: String(p.evidence || "未提供回答证据") };
    });
    const total = Math.max(0, Math.min(100, Math.round(pointScores.reduce((sum: number, p: any) => sum + p.score, 0))));
    const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter(v => typeof v === "string") : [];
    const blockers = strings(parsed.blockers);
    const result: ScoreResult = { ...fallback, itemId, moduleId: item.moduleId, pointScores, total, pointCoverage: total,
      hitPoints: pointScores.filter(p => p.score === p.maxScore).map(p => p.point),
      missingPoints: pointScores.filter(p => p.score < p.maxScore).map(p => p.point),
      errorStatements: strings(parsed.errorStatements), evidence: pointScores.map(p => p.evidence), tags: strings(parsed.tags), blockers,
      feedback: { correct: String(parsed.feedback?.correct || fallback.feedback.correct), gap: String(parsed.feedback?.gap || fallback.feedback.gap), next: String(parsed.feedback?.next || fallback.feedback.next) },
      followUpNeeded: total < 80, followUp: item.followUp, mode: "ai" };
    return Response.json(result);
  } catch { return Response.json(fallback); }
}
