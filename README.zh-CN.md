# 半岛黄埔军校 AI 学习与测评 Demo

L1–L7 销售课程学习平台原型。目前 L3 声光电基础提供 P1–P6 课程知识、课前测试、AI 课程问答、答案要点评分及章节勋章，其他课程为模拟入口。

## 本地运行

需要 Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
```

打开 http://127.0.0.1:5173/。

## 模型配置

在根目录创建 `.env.local`，配置 TokenHub Anthropic Messages 接口：

```dotenv
ANTHROPIC_AUTH_TOKEN=填写自己的 TokenHub API 密钥
ANTHROPIC_BASE_URL=https://tokenhub.tencentmaas.com
ANTHROPIC_MODEL=glm-5.3-flash
```

支持 `glm-5.3-flash` 和 `deepseek-v4-flash`，修改 `ANTHROPIC_MODEL` 即可切换。修改后重启服务。课程问答、考试评分、每日学习建议和课程内容生成共用服务端配置，未配置时使用演示或规则模式。密钥文件已被 Git 忽略。旧版 `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` OpenAI 兼容配置仍可使用。

## 本地视频

将 P1 MP4 放到 `public/videos/l3-p1.mp4`。课程视频不包含在仓库中，P2–P6 视频待接入。知识点时间戳需结合最终视频校准。

## 验证

```bash
npx tsc --noEmit
```

详细模型配置参见 `AI配置说明.md`。
