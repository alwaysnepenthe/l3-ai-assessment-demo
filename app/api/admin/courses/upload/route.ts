import { deterministicGeneration, type CourseNode } from "@/lib/course-content";
import { getModule } from "@/lib/course";
import { createModelCompletion, hasAIConfiguration } from "@/lib/ai-provider";

async function generateWithAI(moduleId: string, transcript = "") {
  const fallback = deterministicGeneration(moduleId);
  if (!hasAIConfiguration()) return { ...fallback, mode: "rules" };
  const module = getModule(moduleId);
  try {
    const raw = await createModelCompletion(
      {
        model: process.env.AI_MODEL || "gpt-4.1-mini",
        temperature: .2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "你是医美培训课程编辑。只依据课程知识与转写生成 JSON，包含 guide 和 nodes。nodes 为 5 个对象，每个包含 ratio(0-1) 与 label。不生成医疗参数或治疗方案。" },
          { role: "user", content: JSON.stringify({ title: module.title, objective: module.objective, conclusion: module.conclusion, anchor: module.anchor, requiredPoints: module.requiredPoints, misconceptions: module.misconceptions, boundary: module.boundary, uploadedCourseMaterial: transcript.slice(0, 12000) }) },
        ],
      },
    ) as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = JSON.parse(raw.choices?.[0]?.message?.content || "{}") as { guide?: string; nodes?: CourseNode[] };
    if (!parsed.guide || !Array.isArray(parsed.nodes)) throw new Error("invalid generation");
    return { guide: parsed.guide, nodes: parsed.nodes.slice(0, 6), mode: "ai" };
  } catch {
    return { ...fallback, mode: "rules" };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { moduleId?: string; transcript?: string };
    const moduleId = String(body.moduleId || "");
    if (!/^P[1-6]$/.test(moduleId)) return Response.json({ error: "请选择有效的课程小节" }, { status: 400 });
    const generated = await generateWithAI(moduleId, String(body.transcript || ""));
    return Response.json({ ok: true, ...generated });
  } catch { return Response.json({ error: "AI 课程内容生成失败" }, { status: 500 }); }
}

