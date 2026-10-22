import { getModule } from "@/lib/course";

export async function POST(request: Request) {
  const { moduleId, question, history = [] } = await request.json() as { moduleId: string; question: string; history?: Array<{ role: "user" | "assistant"; content: string }> };
  if (!question?.trim()) return Response.json({ error: "请输入问题" }, { status: 400 });
  const module = getModule(moduleId || "P1");
  if (!module) return Response.json({ error: "章节不存在" }, { status: 404 });
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return Response.json({ answer: `当前未配置 AI_API_KEY。就本节课程而言，核心结论是：${module.conclusion}。建议用“${module.anchor}”理解视频内容。`, mode: "demo" });
  try {
    const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4.1-mini", temperature: 0.2, messages: [
        { role: "system", content: `你是半岛黄埔军校课程AI助教。只能依据以下课程资料回答，不得提供个体诊断、治疗参数、操作方案或项目组合。课程资料：${JSON.stringify(module)}` },
        ...history.filter(m => ["user", "assistant"].includes(m.role) && typeof m.content === "string").slice(-6), { role: "user", content: question }
      ] })
    });
    if (!response.ok) throw new Error(`AI ${response.status}`);
    const data = await response.json() as any;
    return Response.json({ answer: data.choices?.[0]?.message?.content || "暂时没有生成回答。", mode: "ai" });
  } catch {
    return Response.json({ answer: `模型服务暂时不可用。课程核心结论：${module.conclusion}`, mode: "fallback" });
  }
}
