// app/api/user/profile/route.ts
// 获取和更新用户的完整学习档案

import { memorySystem } from "@/lib/user-memory-system";
import type { UserProfile } from "@/lib/user-memory-system";

/**
 * GET /api/user/profile?userId={userId}
 * 获取用户档案、学习进度、长期记忆
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user";

    // 获取用户档案
    let profile = await memorySystem.getOrCreateUserProfile(userId);
    if (!profile.name || ["演示学员", "林晓雨"].includes(profile.name) || !profile.email || !profile.department || !profile.registrationInfo?.position || !profile.registrationInfo?.specialization) {
      profile = await memorySystem.updateUserProfile(userId, {
        name: !profile.name || ["演示学员", "林晓雨"].includes(profile.name) ? "盛思婕" : profile.name,
        email: ["demo.learner@peninsula.local", "lin.xiaoyu@example.com"].includes(profile.email || "") || !profile.email ? "shengsijie@example.com" : profile.email,
        department: profile.department === "销售培训部" || !profile.department ? "华东大区·上海销售组" : profile.department,
        registrationInfo: {
          ...profile.registrationInfo,
          position: profile.registrationInfo?.position || "医美销售顾问",
          specialization: profile.registrationInfo?.specialization || "光电抗衰与皮肤管理",
          yearsOfExperience: ["演示学员", "林晓雨"].includes(profile.name) ? 2 : profile.registrationInfo?.yearsOfExperience ?? 2,
        },
      });
    }

    // 获取长期记忆
    const ltm = await memorySystem.getLongTermMemory(userId);

    // 获取学习进度摘要
    const progressSummary = await memorySystem.getLearningProgressSummary(userId);

    // 生成助教上下文（用于前端显示或API调用）
    const tutorContextP1 = await memorySystem.generateTutoringContext(userId, "P1");

    return Response.json({
      success: true,
      profile,
      longTermMemory: ltm,
      progressSummary,
      tutorContext: tutorContextP1,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return Response.json({ error: "获取档案失败" }, { status: 500 });
  }
}

/**
 * POST /api/user/profile
 * 创建或更新用户档案
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      userId: string;
      name?: string;
      role?: 'sales' | 'manager' | 'new_hire';
      email?: string;
      department?: string;
      registrationInfo?: {
        position?: string;
        specialization?: string;
        yearsOfExperience?: number;
      };
      learningStyle?: {
        preferredLanguage?: 'concise' | 'detailed';
      };
    };

    const { userId, ...updates } = body;
    if (!userId) {
      return Response.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const profile = await memorySystem.updateUserProfile(userId, updates as Partial<UserProfile>);
    const ltm = await memorySystem.getLongTermMemory(userId);

    return Response.json({
      success: true,
      profile,
      longTermMemory: ltm,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return Response.json({ error: "更新档案失败" }, { status: 500 });
  }
}
