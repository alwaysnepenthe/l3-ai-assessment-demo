# AI 模型配置

在项目根目录的 `.env.local` 填写 TokenHub 配置：

```dotenv
ANTHROPIC_AUTH_TOKEN=你的 TokenHub API 密钥
ANTHROPIC_BASE_URL=https://tokenhub.tencentmaas.com
ANTHROPIC_MODEL=glm-5.3-flash
```

可用模型：`glm-5.3-flash`、`deepseek-v4-flash`。切换模型时修改 `ANTHROPIC_MODEL` 即可。服务端会请求 Anthropic Messages 兼容接口，并自动补上 `/v1/messages`。

也可以沿用旧的 OpenAI 兼容配置：

```dotenv
AI_API_KEY=你的密钥
AI_BASE_URL=https://你的服务地址/v1
AI_MODEL=你的模型名称
```

填写后重启本地服务：在项目目录运行 `npm run dev`。浏览器访问 http://127.0.0.1:5173/。

视频 AI 助教、课程问答、考试评分、每日学习建议和课程内容生成共用该配置。未填写密钥时使用演示或规则模式；密钥只在服务端读取，不会发送到浏览器，也不会提交到 Git。

P1 已接入 public/videos/l3-p1.mp4。P2—P6 等待各自视频，避免把 P1 冒充成其他章节。时间点目前是脚本参考映射，尚需对照最终视频校准。
