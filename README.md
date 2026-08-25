# Soothsayer Frontend

MetaSight 的 Next.js 16 前端，通过 HTTP API 连接独立的 `soothsayer-backend` 服务。

## 环境要求

- Node.js 20.9 或更高版本（推荐 Node.js 22 LTS）
- npm 10 或更高版本
- 本地运行的 [soothsayer-backend](https://github.com/zhaocongcong994/soothsayer-backend)

## 本地运行

先在另一个终端启动后端，确认 `http://localhost:3001/api/health` 返回 `{"status":"ok"}`，然后运行：

```bash
npm install
cp .env.example .env.local
npm run dev
```

访问 `http://localhost:3000`。默认 API 地址是 `http://localhost:3001`，如后端部署在其他地址，修改 `.env.local` 中的 `NEXT_PUBLIC_API_BASE_URL` 后重启前端。

测试期登录验证码固定为 `123456`。LLM API Key 配置在后端；未配置时聊天会返回占位提示，不影响登录、命盘和页面联调。

## 常用命令

```bash
npm run dev    # 启动开发服务器
npm run lint   # ESLint 检查
npm run build  # Webpack 生产构建
npm start      # 启动已构建的生产服务
npm run check  # 依次执行 lint 和生产构建
```

## 同时运行前后端

推荐将两个仓库放在同一目录下：

```text
soothsayer/
├── backend/
└── frontend/
```

分别在 `backend` 和 `frontend` 目录执行 `npm install`、`npm run dev` 即可。

也可以从前端目录使用 Docker Compose 一次启动前端、后端和 Nginx：

```bash
docker compose up --build
```

默认假设后端位于 `../backend`。如位置不同，可设置 `SOOTHSAYER_BACKEND_PATH`。Docker Compose 入口为 `http://localhost:8080`。
