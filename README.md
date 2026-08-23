# MetaSight Clone

基于 `/Users/apple/AI/metasight/MetaSight-复刻路线图.md` 实现的最小可演示原型，覆盖阶段 0 + 阶段 1。

## 已完成功能

- 官网 landing 页
- 邮箱 + 验证码登录/注册（测试期固定验证码 `123456`）
- 5 步 onboarding，创建主命盘
- 八字排盘：出生时间 → 四柱、日主、五行、十神、纳音
- 聊天工作台：看运 / 倾听 两种模式
- 看运模式：自动查询命盘 + 查询时间流，注入 Prompt 后流式生成
- 倾听模式：零工具、共情三段式回复
- 左侧历史对话列表与追问
- SQLite 本地数据持久化

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma 7 + SQLite（本地）
- NextAuth.js Credentials
- lunar-javascript（排盘）
- OpenAI-compatible LLM（Kimi / MiniMax 等）

## 本地运行

```bash
cd /Users/apple/AI/metasight-clone
npm install

# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 LLM_API_KEY、LLM_BASE_URL、LLM_MODEL

# 2. 生成 Prisma Client
npx prisma generate

# 3. 初始化数据库
npx prisma migrate dev --name init

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000。

## 验证排盘

已用 1990-01-15 12:30 男性验证：

```
四柱：己巳 / 丁丑 / 庚辰 / 壬午
日主：庚辰（金）
2026 流年：丙午 · 七杀 · 天河水
```

## 测试账号

- 邮箱：任意邮箱
- 验证码：`123456`

## 待完成（阶段 2）

- 问事模式（六爻起卦 + 解读）
- 随缘路由
- 命运档案 CRUD
- 人生星云图
- 每日运势
- 订阅计费
- 微信/手机号登录
