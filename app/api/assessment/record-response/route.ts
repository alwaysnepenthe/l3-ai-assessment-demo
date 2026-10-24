// app/api/assessment/record-response/route.ts
// 记录用户答题行为到长期记忆系统

import { memorySystem } from "@/lib/user-memory-system";

/**
 * POST /api/assessment/record-response
 * 记录用户的答题行为，更新知识图谱和诊断信息
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      userId?: string;
      courseId: string;
      score: number;
      misconception?: string;
    };

    const {
      userId = "demo-user",
      courseId,
      score,
      misconception,
    } = body;

    if (!courseId || score === undefined) {
      return Response.json({ error: "缺少courseId或score" }, { status: 400 });
    }

    // 记录答题到用户的长期记忆
    await memorySystem.recordQuestionResponse(userId, courseId, score, misconception);

    // 诊断当前学习状态
    const diagnosis = await memorySystem.diagnoseLearningSession(userId, courseId);

    // 获取学习进度摘要
    const progressSummary = await memorySystem.getLearningProgressSummary(userId);

    return Response.json({
      success: true,
      diagnosis,
      recommendation: diagnosis.suggestedNextAction,
      progressSummary,
    });
  } catch (error) {
    console.error("Error recording response:", error);
    return Response.json({ error: "记录失败" }, { status: 500 });
  }
}
