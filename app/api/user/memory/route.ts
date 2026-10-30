// app/api/user/memory/route.ts
// 管理用户长期记忆和课程总结

import { memorySystem } from "@/lib/user-memory-system";
import { createModelCompletion, hasAIConfiguration } from "@/lib/ai-provider";

/**
 * GET /api/user/memory?userId={userId}
 * 获取用户长期记忆
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user";

    const ltm = await memorySystem.getLongTermMemory(userId);

    return Response.json({
      success: true,
      longTermMemory: ltm,
    });
  } catch (error) {
    console.error("Error fetching long-term memory:", error);
    return Response.json({ error: "获取长期记忆失败" }, { status: 500 });
  }
}

/**
 * POST /api/user/memory
 * 生成并保存课程完成后的长期记忆摘要
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      userId: string;
      courseId: string;
      title: string;
      scores: number[];
      masteredPoints: string[];
      strugglingPoints: string[];
      suggestions: string[];
    };

    const {
      userId,
      courseId,
      title,
      scores,
      masteredPoints,
      strugglingPoints,
      suggestions,
    } = body;

    if (!userId || !courseId || !title) {
      return Response.json(
        { error: "userId, courseId, and title are required" },
        { status: 400 }
      );
    }

    let aiSuggestions = suggestions;
    if (hasAIConfiguration()) {
      try {
        const result = await createModelCompletion(
          {
            model: process.env.AI_MODEL || "gpt-4o-mini",
            temperature: 0.2,
            messages: [
              { role: "system", content: "你是学习记录整理助手。只能依据输入中的分数和标签总结，不得自行补充专业知识或推断未提供的事实。把薄弱点转成具体复习建议，返回 JSON：{\"suggestions\":[最多5条简短中文建议]}。" },
              { role: "user", content: JSON.stringify({ title, scores, masteredPoints, strugglingPoints, suggestions }) },
            ],
          },
          30000,
        ) as { choices?: Array<{ message?: { content?: string } }> };
        const content = result.choices?.[0]?.message?.content || "";
        const parsed = JSON.parse(content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as { suggestions?: unknown };
        if (Array.isArray(parsed.suggestions)) aiSuggestions = parsed.suggestions.filter((item): item is string => typeof item === "string").slice(0, 5);
      } catch {
        // Deterministic recommendations remain available when the model is unavailable.
      }
    }

    const summary = await memorySystem.generateCourseSummary(
      userId,
      courseId,
      title,
      scores,
      masteredPoints,
      strugglingPoints,
      aiSuggestions
    );

    const ltm = await memorySystem.getLongTermMemory(userId);
    const progressSummary = await memorySystem.getLearningProgressSummary(userId);

    return Response.json({
      success: true,
      summary,
      longTermMemory: ltm,
      progressSummary,
    });
  } catch (error) {
    console.error("Error generating course summary:", error);
    return Response.json({ error: "生成课程总结失败" }, { status: 500 });
  }
}
