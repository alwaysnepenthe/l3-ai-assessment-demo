// lib/user-memory-system.ts - 生产级个性化学习记忆系统
// 基于 Anki + Open edX + Kolibri 的融合设计

export interface UserProfile {
  userId: string;
  name: string;
  role: 'sales' | 'manager' | 'new_hire';
  email?: string;
  department?: string;
  joinDate: string;
  registrationInfo?: {
    position?: string;
    specialization?: string;
    yearsOfExperience?: number;
  };
  learningStyle: {
    preferredLanguage: 'concise' | 'detailed';
  };
  lastLogin?: string;
}

export interface CourseSummary {
  courseId: string;
  title: string;
  completedAt: string;
  masteredPoints: string[];
  strugglingPoints: string[];
  suggestions: string[];
  averageScore: number;
  passedAt?: string;
}

export interface LongTermMemory {
  userId: string;
  completedCourses: CourseSummary[];
  overallStrengths: string[];
  overallWeaknesses: string[];
  learningPath: string;
  updatedAt: string;
}

export interface KnowledgeGraph {
  masteredConcepts: string[];
  strugglingTopics: string[];
  misconceptionPatterns: string[];
  courseProgress: Record<string, {
    preTestScore?: number;
    postTestScore?: number;
    lastAttempt?: string;
  }>;
}

export interface SessionDiagnosis {
  masteredPoints: string[];
  strugglingPoints: string[];
  misconceptionPatterns: string[];
  confidenceLevel: number;
  readinessToNextChapter: boolean;
  suggestedNextAction: 'continue' | 'review' | 'skip';
}

/**
 * 个性化学习记忆系统 - 核心实现
 * 记录用户的长期学习档案，驱动AI个性化
 */
export class UserMemorySystem {
  private userProfiles = new Map<string, UserProfile>();
  private knowledgeGraphs = new Map<string, KnowledgeGraph>();
  private longTermMemories = new Map<string, LongTermMemory>();
  private responseHistory: Array<{
    userId: string;
    courseId: string;
    score: number;
    misconception?: string;
    timestamp: string;
  }> = [];
  private storageKey = 'l3-user-memory-v2';
  private initialized = false;

  /**
   * 初始化系统，从存储加载数据
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (typeof window === 'undefined') {
      this.initialized = true;
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.userProfiles = new Map(data.userProfiles || []);
        this.knowledgeGraphs = new Map(data.knowledgeGraphs || []);
        this.longTermMemories = new Map(data.longTermMemories || []);
        this.responseHistory = data.responseHistory || [];
      }
    } catch (e) {
      console.warn('Failed to load memory from storage:', e);
    }
    this.initialized = true;
  }

  /**
   * 保存所有数据到localStorage
   */
  private async persist(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const data = {
        userProfiles: Array.from(this.userProfiles.entries()),
        knowledgeGraphs: Array.from(this.knowledgeGraphs.entries()),
        longTermMemories: Array.from(this.longTermMemories.entries()),
        responseHistory: this.responseHistory,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to persist memory:', e);
    }
  }

  /**
   * 获取或创建用户档案
   */
  async getOrCreateUserProfile(
    userId: string,
    userName = "盛思婕",
    role: UserProfile['role'] = 'new_hire'
  ): Promise<UserProfile> {
    await this.initialize();

    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    const profile: UserProfile = {
      userId,
      name: userName,
      role,
      email: "shengsijie@example.com",
      department: "华东大区·上海销售组",
      registrationInfo: { position: "医美销售顾问", specialization: "光电抗衰与皮肤管理", yearsOfExperience: 2 },
      joinDate: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString(),
      learningStyle: {
        preferredLanguage: role === 'sales' ? 'concise' : 'detailed',
      },
    };

    this.userProfiles.set(userId, profile);
    this.knowledgeGraphs.set(userId, {
      masteredConcepts: [],
      strugglingTopics: [],
      misconceptionPatterns: [],
      courseProgress: {},
    });
    this.longTermMemories.set(userId, {
      userId,
      completedCourses: [],
      overallStrengths: [],
      overallWeaknesses: [],
      learningPath: role === 'new_hire' ? 'beginner' : 'advanced',
      updatedAt: new Date().toISOString(),
    });

    await this.persist();
    return profile;
  }

  /**
   * 更新用户档案信息
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    await this.initialize();
    const profile = await this.getOrCreateUserProfile(userId);
    const updated = { ...profile, ...updates, lastLogin: new Date().toISOString() };
    this.userProfiles.set(userId, updated);
    await this.persist();
    return updated;
  }

  /**
   * 记录一次答题
   */
  async recordQuestionResponse(
    userId: string,
    courseId: string,
    score: number,
    misconception?: string
  ): Promise<void> {
    await this.initialize();

    this.responseHistory.push({
      userId,
      courseId,
      score,
      misconception,
      timestamp: new Date().toISOString(),
    });

    const kg = this.knowledgeGraphs.get(userId);
    if (!kg) return;

    if (score >= 85 && !kg.masteredConcepts.includes(courseId)) {
      kg.masteredConcepts.push(courseId);
    }
    if (score < 60 && !kg.strugglingTopics.includes(courseId)) {
      kg.strugglingTopics.push(courseId);
    }
    if (misconception && !kg.misconceptionPatterns.includes(misconception)) {
      kg.misconceptionPatterns.push(misconception);
    }

    if (!kg.courseProgress[courseId]) {
      kg.courseProgress[courseId] = {};
    }
    kg.courseProgress[courseId].postTestScore = score;
    kg.courseProgress[courseId].lastAttempt = new Date().toISOString();

    await this.persist();
  }

  /**
   * 诊断当前学习会话
   */
  async diagnoseLearningSession(userId: string, courseId: string): Promise<SessionDiagnosis> {
    await this.initialize();

    const userResponses = this.responseHistory.filter(r => r.userId === userId && r.courseId === courseId);
    const recentResponses = userResponses.slice(-10);

    if (recentResponses.length === 0) {
      return {
        masteredPoints: [],
        strugglingPoints: [],
        misconceptionPatterns: [],
        confidenceLevel: 50,
        readinessToNextChapter: false,
        suggestedNextAction: 'continue',
      };
    }

    const scores = recentResponses.map(r => r.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const misconceptions = recentResponses
      .filter(r => r.misconception)
      .map(r => r.misconception!)
      .filter((v, i, a) => a.indexOf(v) === i);

    const highScores = scores.filter(s => s >= 80).length;
    const readinessToNextChapter = avgScore >= 80 && misconceptions.length === 0 && highScores === scores.length;

    let suggestedNextAction: 'continue' | 'review' | 'skip' = 'continue';
    if (readinessToNextChapter) {
      suggestedNextAction = 'skip';
    } else if (scores.filter(s => s < 60).length >= 4) {
      suggestedNextAction = 'review';
    }

    return {
      masteredPoints: ['核心要点已掌握'],
      strugglingPoints: scores.filter(s => s < 60).length > 0 ? ['需要加强的部分'] : [],
      misconceptionPatterns: misconceptions.slice(0, 2),
      confidenceLevel: Math.round(Math.max(0, Math.min(100, avgScore))),
      readinessToNextChapter,
      suggestedNextAction,
    };
  }

  /**
   * 生成AI助教的完整上下文
   */
  async generateTutoringContext(userId: string, courseId: string): Promise<string> {
    await this.initialize();

    const profile = await this.getOrCreateUserProfile(userId);
    const kg = this.knowledgeGraphs.get(userId);
    const diagnosis = await this.diagnoseLearningSession(userId, courseId);
    const ltm = this.longTermMemories.get(userId);

    const languageStyle = profile.learningStyle.preferredLanguage === 'concise'
      ? '简洁、直击核心'
      : '详细、循序渐进';

    const roleContext = profile.role === 'new_hire'
      ? '你是一位热情的带教老师，用鼓励和循序渐进的方式引导'
      : '你是一位资深导师，直接提供干货，根据薄弱知识点跳着推进';

    const ltmContext = ltm?.completedCourses.length
      ? `已完成课程：${ltm.completedCourses.map(c => c.title).join('、')}`
      : '这是用户的首次学习';

    return `
【${profile.name}的私人AI助教】
${roleContext}

【个人档案】
- 身份：${profile.role === 'sales' ? '销售代表' : profile.role === 'manager' ? '管理者' : '新员工'}
- ${profile.registrationInfo?.position ? `岗位：${profile.registrationInfo.position}` : ''}
- ${profile.registrationInfo?.specialization ? `主攻方向：${profile.registrationInfo.specialization}` : ''}
- 入职时间：${profile.joinDate}

【长期学习档案】
- ${ltmContext}
- 总体优势：${ltm?.overallStrengths.join('、') || '正在发现'}
- 持续挑战：${ltm?.overallWeaknesses.join('、') || '暂无'}

【当前课程状态】
- 信心度：${diagnosis.confidenceLevel}%
- 已掌握：${kg?.masteredConcepts.join('、') || '正在学习'}
- 薄弱点：${kg?.strugglingTopics.join('、') || '暂无'}

【教学策略】
用${languageStyle}的方式讲解，专注于${diagnosis.strugglingPoints[0] || '核心概念'}。
    `.trim();
  }

  /**
   * 生成长期学习记忆（课程完成后调用）
   */
  async generateCourseSummary(
    userId: string,
    courseId: string,
    title: string,
    scores: number[],
    masteredPoints: string[],
    strugglingPoints: string[],
    suggestions: string[]
  ): Promise<CourseSummary> {
    await this.initialize();

    const summary: CourseSummary = {
      courseId,
      title,
      completedAt: new Date().toISOString(),
      masteredPoints,
      strugglingPoints,
      suggestions,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      passedAt: scores.some(s => s >= 80) ? new Date().toISOString() : undefined,
    };

    const ltm = this.longTermMemories.get(userId);
    if (ltm) {
      ltm.completedCourses = [...ltm.completedCourses.filter(c => c.courseId !== courseId), summary];
      ltm.overallStrengths = Array.from(
        new Set([...ltm.overallStrengths, ...masteredPoints])
      ).slice(0, 5);
      ltm.overallWeaknesses = Array.from(
        new Set([...ltm.overallWeaknesses, ...strugglingPoints])
      ).slice(0, 5);
      ltm.updatedAt = new Date().toISOString();
      await this.persist();
    }

    return summary;
  }

  /**
   * 获取用户学习进度摘要
   */
  async getLearningProgressSummary(userId: string): Promise<string> {
    await this.initialize();

    const profile = await this.getOrCreateUserProfile(userId);
    const kg = this.knowledgeGraphs.get(userId)!;
    const ltm = this.longTermMemories.get(userId)!;
    const userResponses = this.responseHistory.filter(r => r.userId === userId);
    const avgScore = userResponses.length > 0
      ? userResponses.reduce((sum, r) => sum + r.score, 0) / userResponses.length
      : 0;

    return `
📊 ${profile.name}的学习档案

✓ 已完成课程：${ltm.completedCourses.length} 门
✓ 已掌握核心：${kg.masteredConcepts.length} 个概念
⚠️ 需加强：${kg.strugglingTopics.length} 个难点
📈 平均成绩：${Math.round(avgScore)} 分
    `.trim();
  }

  /**
   * 获取用户长期记忆
   */
  async getLongTermMemory(userId: string): Promise<LongTermMemory> {
    await this.initialize();
    let ltm = this.longTermMemories.get(userId);
    if (!ltm) {
      await this.getOrCreateUserProfile(userId);
      ltm = this.longTermMemories.get(userId)!;
    }
    return ltm;
  }
}

// 全局实例
export const memorySystem = new UserMemorySystem();

// 初始化demo数据
export async function initDemoData() {
  const userId = 'demo-user';
  await memorySystem.updateUserProfile(userId, {
    name: '李明',
    role: 'sales',
    registrationInfo: {
      position: '销售代表',
      specialization: '皮肤护理',
      yearsOfExperience: 2,
    },
  });

  // 模拟之前的学习记录
  await memorySystem.recordQuestionResponse(userId, 'P1', 92, undefined);
  await memorySystem.recordQuestionResponse(userId, 'P1', 88, undefined);
  await memorySystem.recordQuestionResponse(userId, 'P1', 85, undefined);
  await memorySystem.recordQuestionResponse(userId, 'P2', 72, '波长越高越好');
  await memorySystem.recordQuestionResponse(userId, 'P2', 68, '波长越高越好');

  // 生成课程总结（长期记忆）
  await memorySystem.generateCourseSummary(
    userId,
    'P1',
    '能量是什么',
    [92, 88, 85],
    ['能量的定义', '能量传播原理'],
    [],
    ['继续巩固能量概念的应用场景']
  );

  await memorySystem.generateCourseSummary(
    userId,
    'P2',
    '能量的传播与分布',
    [72, 68],
    ['基础波长概念'],
    ['波长与能量的关系'],
    ['需要复习波长相关知识']
  );
}
