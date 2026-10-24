import { getModule } from "@/lib/course";
import { memorySystem } from "@/lib/user-memory-system";

export async function POST(request: Request) {
  const { userId = "demo-user", courseId = "L3-SG-01", moduleId = "P1", recentAttempts = [] } = await request.json() as { userId?: string; courseId?: string; moduleId?: string; recentAttempts?: Array<{moduleId:string;moduleTitle:string;score:number;missingPoints:string[];blockers:string[]}> };
  const module = getModule(moduleId);
  if (!module) return Response.json({ error: "章节不存在" }, { status: 404 });
  try {
    const [profile, context, memory] = await Promise.all([memorySystem.getOrCreateUserProfile(userId), memorySystem.generateTutoringContext(userId, courseId), memorySystem.getLongTermMemory(userId)]);
    const recentWeak = recentAttempts.filter(item => item.score < 80).slice(-1)[0];
    const weak = recentWeak?.missingPoints?.[0] || recentWeak?.blockers?.[0] || memory.overallWeaknesses[0] || module.title;
    const fallback = profile.role === "new_hire"
      ? "今天先从 " + module.id + "「" + module.title + "」开始。建议先完成课前测试，再根据薄弱点看视频；我会陪你把主线理清。"
      : "今天建议优先复习「" + weak + "」，然后直接挑战 " + module.id + " 课前测试；已掌握的内容可以快速通关，把时间留给薄弱点。";
    const key = process.env.AI_API_KEY;
    if (!key) return Response.json({ guide: fallback, mode: "demo" });
    try {
      const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
      const response = await fetch(base + "/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
        body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4.1-mini", temperature: 0.7, messages: [
          { role: "system", content: "你是销售课程私人学习助教。根据学员档案和学习记忆，写一条友好、具体、60字以内的今日学习建议，建议回到课程或复习薄弱点，不提供医疗建议。" },
          { role: "user", content: JSON.stringify({ profile, memory, recentAttempts: recentAttempts.slice(-8), tutoringContext: context, currentLesson: { id: module.id, title: module.title, anchor: module.anchor } }) },
        ] }),
      });
      if (!response.ok) throw new Error("Model unavailable");
      const data = await response.json() as any;
      return Response.json({ guide: data.choices?.[0]?.message?.content?.trim() || fallback, mode: "ai" });
    } catch { return Response.json({ guide: fallback, mode: "fallback" }); }
  } catch { return Response.json({ guide: "今天可以从 L3 声光电基础开始：先做一个小节的课前测试，再按结果决定是否看视频。", mode: "fallback" }); }
}
