"use client";
import { useEffect, useState } from "react";
import { Pencil, X, BookOpen, CircleCheck, ChartColumn, Lightbulb, TrendingUp, TriangleAlert, Award, Trophy } from "lucide-react";
import { DirectionLabel } from "@/components/DirectionalIcon";
import "./personal-home-icons.css";
import type { UserProfile, LongTermMemory } from "@/lib/user-memory-system";

interface PersonalHomeProps {
  userId: string;
  onOpenAssistant?: () => void;
}

export default function PersonalHome({ userId, onOpenAssistant }: PersonalHomeProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ltm, setLtm] = useState<LongTermMemory | null>(null);
  const [progressSummary, setProgressSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [localBadges, setLocalBadges] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<Array<{moduleId:string;score:number;missingPoints?:string[];hitPoints?:string[]}>>([]);
  const [formData, setFormData] = useState({
    name: "",
    role: "sales" as UserProfile['role'],
    email: "",
    department: "",
    position: "",
    specialization: "",
  });

  useEffect(() => {
    fetchUserData();
    try {
      setLocalBadges(JSON.parse(localStorage.getItem("l3-badges-v2") || "[]"));
      setAttempts(JSON.parse(localStorage.getItem("l3-short-memory-v1") || "[]"));
    } catch {}
  }, [userId]);

  async function fetchUserData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/profile?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json() as { profile: UserProfile; longTermMemory: LongTermMemory; progressSummary: string };
      setProfile(data.profile);
      setLtm(data.longTermMemory);
      setProgressSummary(data.progressSummary);
      setFormData({
        name: data.profile.name,
        role: data.profile.role,
        email: data.profile.email || "",
        department: data.profile.department || "",
        position: data.profile.registrationInfo?.position || "",
        specialization: data.profile.registrationInfo?.specialization || "",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: formData.name,
          role: formData.role,
          email: formData.email,
          department: formData.department,
          registrationInfo: {
            position: formData.position,
            specialization: formData.specialization,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setEditMode(false);
      await fetchUserData();
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  }

  if (loading) {
    return <div className="lp-loading">加载中...</div>;
  }

  if (!profile || !ltm) {
    return <div className="lp-error">加载用户信息失败</div>;
  }

  const masteredCount = ltm.completedCourses.filter(c => c.passedAt).length;
  const totalCourses = ltm.completedCourses.length;
  const avgScore = totalCourses > 0
    ? Math.round(ltm.completedCourses.reduce((sum, c) => sum + c.averageScore, 0) / totalCourses)
    : 0;
  const moduleScores = ["P1","P2","P3","P4","P5","P6"].map(id => {
    const values = attempts.filter(a => a.moduleId === id).map(a => a.score);
    return { id, score: values.length ? Math.round(values.reduce((a,b)=>a+b,0)/values.length) : 0 };
  });
  const displayStrengths = ltm.overallStrengths.length ? ltm.overallStrengths : [
    "你已经能把设备输出的能量与最终效果区分开，并开始沿着能量传递、靶点作用和组织反应解释结果。",
    "你愿意用完整因果链组织表达，这是建立专业沟通能力的好基础。",
  ];
  const attemptedWeakPoints = Array.from(new Set(attempts.flatMap(a => a.missingPoints || [])));
  const displayChallenges = ltm.overallWeaknesses.length ? ltm.overallWeaknesses : attemptedWeakPoints.length ? attemptedWeakPoints.slice(0, 2).map(point => `继续练习说明「${point}」，试着把它放回完整的能量作用链中。`) : [
    "遇到陌生设备时，继续练习判断问题层次与靶组织，不要只看设备名称或单一参数下结论。",
    "解释效果时，试着区分即时组织反应与后续修复、重塑，让客户更容易听懂过程。",
  ];

  return (
    <div className="lp-personal-home">
      {/* 个人基础信息 */}
      <section className="lp-ph-card lp-ph-profile">
        <div className="lp-ph-header">
          <h2>个人档案</h2>
          <button type="button" className="ph-edit-profile" aria-label={editMode ? "取消编辑" : "编辑信息"} title={editMode ? "取消编辑" : "编辑信息"} onClick={() => setEditMode(!editMode)}>{editMode ? <X size={20} aria-hidden="true"/> : <Pencil size={20} aria-hidden="true"/>}</button>
        </div>

        {editMode ? (
          <div className="lp-ph-form">
            <div className="lp-ph-form-row">
              <label>姓名</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入姓名"
              />
            </div>
            <div className="lp-ph-form-row">
              <label>身份</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              >
                <option value="sales">销售代表</option>
                <option value="manager">管理者</option>
                <option value="new_hire">新员工</option>
              </select>
            </div>
            <div className="lp-ph-form-row">
              <label>邮箱</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="输入邮箱"
              />
            </div>
            <div className="lp-ph-form-row">
              <label>部门</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="输入部门"
              />
            </div>
            <div className="lp-ph-form-row">
              <label>岗位</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="输入岗位"
              />
            </div>
            <div className="lp-ph-form-row">
              <label>主攻方向</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="输入主攻方向"
              />
            </div>
            <button className="lp-primary" onClick={handleSaveProfile}>保存信息</button>
          </div>
        ) : (
          <div className="lp-ph-info-grid">
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">姓名</span>
              <p className="lp-ph-value">{profile.name}</p>
            </div>
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">身份</span>
              <p className="lp-ph-value">
                {profile.role === "sales" ? "销售代表" : profile.role === "manager" ? "管理者" : "新员工"}
              </p>
            </div>
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">邮箱</span>
              <p className="lp-ph-value">{profile.email || "-"}</p>
            </div>
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">部门</span>
              <p className="lp-ph-value">{profile.department || "-"}</p>
            </div>
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">岗位</span>
              <p className="lp-ph-value">{profile.registrationInfo?.position || "-"}</p>
            </div>
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">主攻方向</span>
              <p className="lp-ph-value">{profile.registrationInfo?.specialization || "-"}</p>
            </div>
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">入职时间</span>
              <p className="lp-ph-value">{profile.joinDate}</p>
            </div>
            <div className="lp-ph-info-item">
              <span className="lp-ph-label">最后登录</span>
              <p className="lp-ph-value">{profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : "-"}</p>
            </div>
          </div>
        )}
      </section>

      <section className="lp-ph-card lp-ph-assistant">
        <div className="lp-ph-assistant-main"><img src="/assets/peninsula-companion.webp" alt="半小岛"/><div><h2>我的 AI 助教 · 半小岛</h2><p>我会参考你的身份、主攻方向和近期薄弱点，调整讲解方式和学习路线。</p></div><button className="lp-primary" onClick={onOpenAssistant}><DirectionLabel>和我聊聊</DirectionLabel></button></div>
        <div className="lp-ph-persona"><span>{profile.role === "new_hire" ? "新人循序带教" : "资深销售薄弱点巩固"}</span><span>{profile.registrationInfo?.specialization || "专业知识学习"}</span></div>
      </section>

      <section className="lp-ph-card lp-ph-ability">
        <div className="lp-ph-header"><div><h2>我的 <span className="lp-level-mark">L3</span> 能力画像</h2></div><span>根据最近作答动态更新</span></div>
        <div className="lp-ability-bars">{moduleScores.map(item => <div key={item.id}><b>{item.id}</b><i><em style={{width:`${item.score}%`}}/></i><strong className="lp-numeric">{item.score || "—"}</strong></div>)}</div>
      </section>

      <section className="lp-ph-card lp-ph-medals">
        <div className="lp-ph-header"><div><h2>我的勋章墙</h2></div><span>{localBadges.filter(id=>/^P[1-6]$/.test(id)).length}/6 章节勋章</span></div>
        <div className="lp-medal-wall">{["P1","P2","P3","P4","P5","P6"].map((id,index)=><div className={localBadges.includes(id)?"earned":"locked"} key={id}><span><Award className={localBadges.includes(id)?"ph-svg ph-svg-gold":"ph-svg ph-svg-muted"} aria-hidden="true"/></span><b>{id} 第 {index+1} 关</b><small>{localBadges.includes(id)?"已点亮":"待解锁"}</small></div>)}<div className={localBadges.includes("L3-final")?"earned final":"locked final"}><span><Trophy className={localBadges.includes("L3-final")?"ph-svg ph-svg-gold":"ph-svg ph-svg-muted"} aria-hidden="true"/></span><b>L3 总勋章</b><small>{localBadges.includes("L3-final")?"终局通关":"完成六关后解锁"}</small></div></div>
      </section>

      {/* 学习概览 */}
      <section className="lp-ph-card lp-ph-overview">
        <h2>学习概览</h2>
        <div className="lp-ph-stats">
          <div className="lp-ph-stat-item">
            <span className="lp-ph-stat-icon ph-icon-tile ph-tile-blue"><BookOpen aria-hidden="true"/></span>
            <div>
              <p className="lp-ph-stat-value">{totalCourses}</p>
              <p className="lp-ph-stat-label">已完成课程</p>
            </div>
          </div>
          <div className="lp-ph-stat-item">
            <span className="lp-ph-stat-icon ph-icon-tile ph-tile-green"><CircleCheck aria-hidden="true"/></span>
            <div>
              <p className="lp-ph-stat-value">{masteredCount}</p>
              <p className="lp-ph-stat-label">已通过课程</p>
            </div>
          </div>
          <div className="lp-ph-stat-item">
            <span className="lp-ph-stat-icon ph-icon-tile ph-tile-purple"><ChartColumn aria-hidden="true"/></span>
            <div>
              <p className="lp-ph-stat-value lp-numeric">{avgScore}</p>
              <p className="lp-ph-stat-label">平均成绩</p>
            </div>
          </div>
          <div className="lp-ph-stat-item">
            <span className="lp-ph-stat-icon ph-icon-tile ph-tile-amber"><Lightbulb aria-hidden="true"/></span>
            <div>
              <p className="lp-ph-stat-value">{ltm.overallStrengths.length}</p>
              <p className="lp-ph-stat-label">优势领域</p>
            </div>
          </div>
        </div>
      </section>

      {/* 学习进度 */}
      <section className="lp-ph-card lp-ph-courses">
        <h2>我的课程进度</h2>
        {ltm.completedCourses.length === 0 ? (
          <p className="lp-ph-empty">还没有完成任何课程，开始学习吧！</p>
        ) : (
          <div className="lp-ph-courses-list">
            {ltm.completedCourses.map((course) => (
              <div key={course.courseId} className="lp-ph-course-item">
                <div className="lp-ph-course-header">
                  <h3>{course.title}</h3>
                  <span className={`lp-ph-badge ${course.passedAt ? "passed" : "pending"}`}>
                    {course.passedAt ? <><CircleCheck className="ph-svg ph-svg-green ph-svg-small" aria-hidden="true"/>已通过</> : "待完成"}
                  </span>
                </div>
                <div className="lp-ph-course-meta">
                  <span>平均成绩: {course.averageScore}分</span>
                  <span>•</span>
                  <span>{new Date(course.completedAt).toLocaleDateString()}</span>
                </div>
                <div className="lp-ph-course-details">
                  <div className="lp-ph-detail">
                    <span className="lp-ph-detail-label">掌握点:</span>
                    <div className="lp-ph-tags">
                      {course.masteredPoints.map((point, i) => (
                        <span key={i} className="lp-ph-tag passed">{point}</span>
                      ))}
                    </div>
                  </div>
                  <div className="lp-ph-detail">
                    <span className="lp-ph-detail-label">薄弱点:</span>
                    <div className="lp-ph-tags">
                      {course.strugglingPoints.map((point, i) => (
                        <span key={i} className="lp-ph-tag weak">{point}</span>
                      ))}
                    </div>
                  </div>
                  {course.suggestions.length > 0 && (
                    <div className="lp-ph-detail">
                      <span className="lp-ph-detail-label">学习建议:</span>
                      <p className="lp-ph-suggestion">{course.suggestions[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 整体优势与挑战 */}
      <section className="lp-ph-card lp-ph-strengths-weaknesses">
        <div className="lp-ph-two-col">
          <div className="lp-ph-col">
            <h3 className="ph-icon-heading"><TrendingUp className="ph-svg ph-svg-green" aria-hidden="true"/>整体优势</h3>
            <p className="lp-ph-insight">{displayStrengths.join("；")}</p>
          </div>
          <div className="lp-ph-col">
            <h3 className="ph-icon-heading"><TriangleAlert className="ph-svg ph-svg-amber" aria-hidden="true"/>持续挑战</h3>
            <p className="lp-ph-insight">{displayChallenges.join("；")}</p>
          </div>
        </div>
        <div className="lp-ph-coach-cta"><p>想把优势变成稳定表达，或一起拆解某个薄弱点？</p><button className="lp-secondary" onClick={onOpenAssistant}><DirectionLabel>和半小岛聊聊</DirectionLabel></button></div>
      </section>

      {/* 学习进度摘要 */}
      <section className="lp-ph-card lp-ph-summary">
        <h2>学习进度摘要</h2>
        <div className="lp-ph-summary-text">
          {progressSummary.split("\n").map((line,index)=>{
            if(!line.trim())return null;
            const Icon=/^\s*📊/.test(line)?ChartColumn:/^\s*✓/.test(line)?CircleCheck:/^\s*⚠/.test(line)?TriangleAlert:/^\s*📈/.test(line)?TrendingUp:null;
            const tone=Icon===TriangleAlert?"amber":Icon===ChartColumn?"purple":"green";
            const text=line.replace(/^\s*(?:📊|✓|⚠️?|📈)\s*/,"");
            return <p className="ph-summary-line" key={index}>{Icon&&<Icon className={"ph-svg ph-svg-small ph-svg-"+tone} aria-hidden="true"/>}<span>{text}</span></p>;
          })}
        </div>
      </section>

      {/* 今日待办（模拟） */}
      <section className="lp-ph-card lp-ph-todos">
        <h2>今日待办</h2>
        <div className="lp-ph-todo-list">
          <div className="lp-ph-todo-item">
            <input type="checkbox" id="todo1" />
            <label htmlFor="todo1">复习{ltm.overallWeaknesses[0] || "薄弱知识点"}</label>
          </div>
          <div className="lp-ph-todo-item">
            <input type="checkbox" id="todo2" />
            <label htmlFor="todo2">完成下一课程的课前测试</label>
          </div>
          <div className="lp-ph-todo-item">
            <input type="checkbox" id="todo3" />
            <label htmlFor="todo3">向 AI 助教提 3 个课程相关问题</label>
          </div>
        </div>
      </section>
    </div>
  );
}
