# L3 AI 语音测评 Demo

## 功能

- P1–P6 每个小章节采用“课前测试—按需看课—学习后复测”的双路径。
- 36 道版本化题库，覆盖识记、理解、迁移三层能力。
- 浏览器语音识别、实时转写、文字修正与中文语音播报。
- 每题最多一次自适应追问。
- 概念准确性、因果完整性、表达可听懂、边界与风险四维评分。
- 80 分通过并获得小章节勋章；关键医学或合规误区阻断通关。
- 结果报告、薄弱标签、课程回链与按模块补练。
- 未达标题目展示考察知识点及对应视频时间段，每个视频提供 AI 导览。
- 无模型密钥时自动使用规则评分；模型接口异常时自动降级。

## 本地运行

1. 安装 Node.js 22 或更高版本并安装依赖。
2. 复制 `.env.example` 为 `.env.local`，按需填写兼容 OpenAI Chat Completions 的接口配置。
3. 执行 `npm run dev`，使用最新版 Chrome 或 Edge 访问本地地址。
4. 麦克风需要 `localhost` 或 HTTPS；语音识别不可用时仍可文字作答。

## API

- `POST /api/questions/generate`：返回课程版本和 36 道题库。
- `POST /api/assessment/next`：创建六模块测评题序列。
- `POST /api/assessment/score`：返回结构化四维评分与反馈。
- `POST /api/assessment/remediate`：按薄弱模块生成补练题。

服务端环境变量为 `AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`。密钥不会下发浏览器。
