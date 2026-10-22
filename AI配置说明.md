# AI 模型配置

在项目根目录的 .env.local 填写：

```dotenv
AI_API_KEY=你的密钥
AI_BASE_URL=https://你的服务地址/v1
AI_MODEL=你的模型名称
```

接口需兼容 POST /chat/completions。Base URL 只填到 /v1，不要重复填写 /chat/completions。

填写后重启本地服务：在项目目录运行 npm run dev。浏览器访问 http://127.0.0.1:5173/。

视频 AI 助教与考试评分共用该配置。未填写密钥时显示演示模式；真实模型连接成功后显示“真实模型已连接”，评分报告显示“AI 语义评分”。密钥只在服务端读取，不会发送到浏览器，也不会提交到 Git。

P1 已接入 public/videos/l3-p1.mp4。P2—P6 等待各自视频，避免把 P1 冒充成其他章节。时间点目前是脚本参考映射，尚需对照最终视频校准。
