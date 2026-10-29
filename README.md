# 半岛黄埔军校 AI 智能测评与陪练（用户端）

面向医美销售学习与能力成长的演示系统。它不是单纯的“看课平台”，而是把课程学习、课前诊断、章节场景测试、AI 个性化陪练、成长档案与优秀经验沉淀连接成一个闭环。

> 当前仓库包含网页用户端、移动端适配界面，以及为保证本地完整演示而保留的 `/admin` 兼容入口。独立管理后台仓库为 `alwaysnepenthe/l3-ai-assessment-admin`。

## 功能模块

### 网页与移动用户端

- **成长主页**：学习进度、能力状态、推荐任务、勋章与个人成长信息。
- **课程闯关地图**：按能力模块组织课程，支持课前自测、精准学习、复测与章节通关。
- **章节销售场景测试**：5 道真实销售场景题，以语音回答和完成为主；完成后展示通关反馈、章节学习旅程、回答优化点和优化建议。
- **半小岛 AI 学习陪练**：独立对话主页、历史会话、快捷问题、语音输入、课程知识问答，以及只在内容相关时出现的课程跳转。
- **课程内陪练**：在课程学习过程中快速唤醒半小岛，并携带当前课程上下文继续追问。
- **个性化学习记录**：演示薄弱点、学习进度、勋章和长期成长档案。
- **响应式界面**：主要学习、课程、测试和陪练流程支持桌面与移动窄屏。

### 演示管理入口

访问 `/admin` 可体验课程智慧中台：课程管理、课程上传与解析、AI 内容加工、精彩语料中心和发布记录。它保留在本仓库中，是为了让同一域名下的本地演示保持完整；管理后台独立部署请使用单独仓库。

## 访问入口

| 功能 | 地址 |
| --- | --- |
| 用户端首页 | `http://127.0.0.1:5173/` |
| 演示管理后台 | `http://127.0.0.1:5173/admin` |

## 技术栈

- Next.js 16、React 19、TypeScript
- Vinext、Vite
- Cloudflare Workers / Wrangler
- Lucide React
- 浏览器 Web Speech API
- IndexedDB 与 localStorage（演示数据）

## 本地部署

### 环境要求

- Node.js `>= 22.13.0`
- npm
- 推荐最新版 Chrome 或 Edge，以获得更完整的语音能力

### 安装与启动

```bash
git clone https://github.com/alwaysnepenthe/l3-ai-assessment-demo.git
cd l3-ai-assessment-demo
npm ci
npm run dev
```

默认访问 `http://127.0.0.1:5173/`。如需局域网演示：

```bash
npm run dev -- --hostname 0.0.0.0
```

同一局域网设备访问 `http://<电脑局域网IP>:5173/`。Windows 防火墙需要允许 Node.js 使用对应端口。

### 构建与生产预览

```bash
npm run build
npm run start
```

`npm run start` 使用 Wrangler 预览已构建的 Worker，实际端口以终端输出为准。

## AI 配置

复制 `.env.example` 为 `.env.local`：

```env
AI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4.1-mini
```

- 未配置 `AI_API_KEY` 时，课程内容加工接口使用确定性规则结果，便于无密钥演示。
- 不要提交 `.env.local` 或真实密钥。
- 正式上线应接入受控模型服务、知识检索、会话管理、内容审核和安全策略。

## 数据与联动边界

当前版本是演示架构：

- 默认课程清单由 `/api/admin/courses` 返回。
- 管理后台发布后的课程清单保存在浏览器 localStorage。
- 上传视频保存在浏览器 IndexedDB。
- 同一域名、同一浏览器内可以演示本地联动；换浏览器、清除站点数据或跨域部署后，本地数据不会自动同步。

正式部署建议：

1. 使用数据库保存课程、版本、发布记录、学习进度、测评和会话索引。
2. 使用对象存储保存视频、文档和语音文件。
3. 通过统一服务端 API 连接用户端与独立管理后台，并配置鉴权、RBAC、CORS 和审计日志。
4. 模型调用只放在服务端，不向浏览器暴露密钥。
5. 对医疗与业务内容增加人工审核、版本追踪和合规边界。

## 项目结构

```text
app/
  page.tsx                    用户端入口
  learning-platform-v2.tsx   用户端主要页面与交互
  admin/                      同源演示管理入口
  api/admin/courses/          课程清单与内容加工接口
lib/
  course.ts                   课程知识和测评基础数据
  course-content.ts           课程清单与生成规则
  client-course-store.ts      浏览器课程和视频存储
public/assets/                半小岛形象与静态资源
scripts/                      构建和运行脚本
worker/                       Cloudflare Worker 入口
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 按锁文件安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生成生产构建 |
| `npm run start` | 本地预览生产 Worker |
| `npm run lint` | 代码检查 |

## 上线前检查

- 接入数据库、对象存储、统一 API 和用户鉴权。
- 将管理后台部署到独立权限域。
- 为语音识别提供浏览器兼容提示或服务端 ASR 备选。
- 完成课程、模型输出、医疗边界和隐私合规审核。
- 验证桌面端、移动端、弱网和无麦克风权限场景。

## 相关仓库

- 用户端与完整演示：`alwaysnepenthe/l3-ai-assessment-demo`
- 独立管理后台：`alwaysnepenthe/l3-ai-assessment-admin`
