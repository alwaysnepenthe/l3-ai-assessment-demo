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

在根目录创建 `.env.local`，配置兼容 Chat Completions 的服务：

```dotenv
AI_API_KEY=填写自己的密钥
AI_BASE_URL=https://你的模型服务地址/v1
AI_MODEL=你的模型名称
```

修改后重启服务。课程问答和考试评分共用服务端配置，未配置时使用演示模式。密钥文件已被 Git 忽略。

## 本地视频

将 P1 MP4 放到 `public/videos/l3-p1.mp4`。课程视频不包含在仓库中，P2–P6 视频待接入。知识点时间戳需结合最终视频校准。

## 验证

```bash
npx tsc --noEmit
```

详细模型配置参见 `AI配置说明.md`。
