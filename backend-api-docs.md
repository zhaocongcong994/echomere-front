# MetaSight 后端接口文档

## 基础信息

- 本地开发 Base URL：`http://localhost:3001`
- 服务器访问入口：`http://81.70.23.109:8080`（由 nginx 统一代理前端与 API）
- 数据格式：JSON
- 认证方式：Bearer Token（`Authorization: Bearer <token>`）
- 流式接口：`POST /chat/stream` 使用 SSE（`Content-Type: text/event-stream`）

---

## 认证

### 1. 登录 / 注册

**POST** `/auth/login`

邮箱或手机号 + 固定验证码登录。若用户不存在则自动创建。

#### 请求头

```http
Content-Type: application/json
```

#### 请求体

```json
{
  "email": "test@example.com",
  "code": "123456"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱或手机号 |
| code | string | 是 | 固定验证码 `123456` |

#### 响应

**200 OK**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clz...",
    "email": "test@example.com",
    "phone": null,
    "name": "test",
    "locale": "zh",
    "defaultDestinySystem": "bazi"
  }
}
```

**401 Unauthorized**

```json
{ "error": "Invalid code" }
```

---

### 2. 获取当前用户

**GET** `/auth/me`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

```json
{
  "id": "clz...",
  "email": "test@example.com",
  "phone": null,
  "name": "test",
  "locale": "zh",
  "defaultDestinySystem": "bazi",
  "profileCount": 1,
  "conversationCount": 8
}
```

**401 Unauthorized**

```json
{ "error": "Unauthorized" }
```

---

## 用户与档案

### 3. 获取当前用户主档案

**GET** `/profile`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

```json
{
  "user": {
    "id": "clz...",
    "email": "test@example.com",
    "name": "test",
    "phone": null,
    "locale": "zh",
    "defaultDestinySystem": "bazi",
    "createdAt": "2026-08-23T04:00:00.000Z",
    "updatedAt": "2026-08-23T04:00:00.000Z"
  },
  "primaryProfile": {
    "id": "clz...",
    "userId": "clz...",
    "type": "self",
    "name": null,
    "gender": "male",
    "birthDateTime": "1990-01-15T04:30:00.000Z",
    "birthLocation": "",
    "isPrimary": true,
    "baziPillar": "{...}",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "bazi": {
    "year": "己巳",
    "month": "丁丑",
    "day": "庚辰",
    "hour": "壬午",
    "dayMaster": { "gan": "庚", "zhi": "辰", "wuxing": "金" },
    "genderLabel": "元男",
    "wuxing": { "金": 1, "木": 0, "水": 1, "火": 3, "土": 3 },
    "shishen": { "gan": [...], "zhi": [...] },
    "nayin": [...]
  }
}
```

---

### 4. 获取档案列表

**GET** `/profiles`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

Profile 数组。

---

### 5. 创建档案

**POST** `/profiles`

#### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>
```

#### 请求体

```json
{
  "type": "self",
  "name": "测试用户",
  "gender": "male",
  "year": 1990,
  "month": 1,
  "day": 15,
  "hour": 12,
  "minute": 30,
  "birthLocation": "北京市",
  "isPrimary": true
}
```

#### 响应

**200 OK**

返回创建的 Profile 对象。

---

### 6. 更新档案

**PATCH** `/profiles/:id`

#### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>
```

#### 请求体

可选字段同创建档案。若修改出生时间，后端会自动重算八字。

#### 响应

**200 OK**

返回更新后的 Profile 对象。

---

### 7. 删除档案

**DELETE** `/profiles/:id`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

```json
{ "success": true }
```

---

### 8. 首次 Onboarding（创建主命盘）

**POST** `/onboarding`

新用户首次登录后强制填写档案，后端自动计算八字并创建主命盘。

#### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>
```

#### 请求体

```json
{
  "year": 1990,
  "month": 1,
  "day": 15,
  "hour": 12,
  "minute": 30,
  "birthLocation": "北京市",
  "gender": "male",
  "name": "测试用户"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| year/month/day/hour/minute | number | 是 | 阳历出生时间 |
| birthLocation | string | 否 | 出生地点 |
| gender | string | 是 | `male` / `female` / `other` |
| name | string | 否 | 昵称 |

#### 响应

**200 OK**

```json
{
  "profile": { /* Profile 对象 */ },
  "bazi": { /* 八字计算结果 */ }
}
```

---

## 八字计算

### 9. 根据出生时间计算八字

**POST** `/bazi`

无需登录。

#### 请求头

```http
Content-Type: application/json
```

#### 请求体

```json
{
  "year": 1990,
  "month": 1,
  "day": 15,
  "hour": 12,
  "minute": 30,
  "gender": "male"
}
```

#### 响应

**200 OK**

```json
{
  "year": "己巳",
  "month": "丁丑",
  "day": "庚辰",
  "hour": "壬午",
  "dayMaster": { "gan": "庚", "zhi": "辰", "wuxing": "金" },
  "genderLabel": "元男",
  "wuxing": { "金": 1, "木": 0, "水": 1, "火": 3, "土": 3 },
  "shishen": { "gan": [...], "zhi": [...] },
  "nayin": [...]
}
```

---

## 会话与聊天

### 10. 获取最近会话列表

**GET** `/conversations`

默认返回最近 20 条，按 `updatedAt` 降序。

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

```json
[
  {
    "id": "clz...",
    "userId": "clz...",
    "mode": "kanyun",
    "title": "最近感觉不太顺",
    "status": "active",
    "messageCount": 2,
    "createdAt": "...",
    "updatedAt": "...",
    "_count": { "messages": 2 }
  }
]
```

---

### 11. 获取单会话详情

**GET** `/conversations/:id`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

Conversation 对象，含 `messages` 数组。

---

### 12. 流式聊天

**POST** `/chat/stream`

#### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>
```

#### 请求体

```json
{
  "message": "今年事业运如何？",
  "mode": "kanyun",
  "conversationId": "clz..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户消息 |
| mode | string | 是 | `kanyun` / `qingting` / `wenshi` / `suiyuan` |
| conversationId | string | 否 | 会话 ID，不传则新建 |

#### 响应

**SSE 流**

```
Content-Type: text/event-stream

event: meta
data: {"conversationId":"...","mode":"kanyun","routeReason":"...","toolCalls":[...]}

event: chunk
data: {"content":"根据你的八字"}

event: chunk
data: {"content":"，今年事业上有贵人相助。"}

event: done
data: {}
```

---

## 运势与订阅

### 13. 获取每日运势

**GET** `/daily-fortune`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

```json
{
  "profile": { "name": null, "bazi": { /* 八字 */ } },
  "today": {
    "yearGanZhi": "丙午",
    "monthGanZhi": "...",
    "dayGanZhi": "...",
    "dayShiShen": "...",
    "dayWuXing": "..."
  },
  "year": { "ganZhi": "丙午", "shiShen": "七杀", "naYin": "天河水" },
  "date": "2026-08-23"
}
```

**400 Bad Request**

```json
{ "error": "NO_PROFILE" }
```

---

### 14. 获取订阅方案

**GET** `/subscription`

#### 请求头

```http
Authorization: Bearer <token>
```

#### 响应

**200 OK**

```json
{
  "currentPlan": "free",
  "used": 5,
  "limit": null,
  "plans": [
    { "id": "free", "name": "体验版", "price": 0, ... },
    { "id": "pro", "name": "专业版", "price": 9900, ... }
  ]
}
```

---

### 15. 创建订阅

**POST** `/subscription`

#### 请求头

```http
Content-Type: application/json
Authorization: Bearer <token>
```

#### 请求体

```json
{
  "planId": "pro"
}
```

#### 响应

**200 OK**

```json
{
  "success": true,
  "note": "MVP 测试期不扣费"
}
```

---

## 错误码

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 成功 |
| 400 | 请求参数错误 / 业务错误（如 `NO_PROFILE`） |
| 401 | 未登录或 token 无效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 环境变量

| 变量名 | 说明 |
|--------|------|
| `DATABASE_URL` | SQLite 数据库路径，如 `file:./dev.db` 或 `file:/data/dev.db` |
| `JWT_SECRET` | JWT 签名密钥 |
| `LLM_API_KEY` | Moonshot / 大模型 API Key |
| `LLM_BASE_URL` | 大模型 API Base URL |
| `LLM_MODEL` | 模型名称 |
| `PORT` | 后端端口，默认 3001 |

---

## 部署架构

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   nginx     │──────│  frontend   │      │   backend   │
│  :8080→80   │      │   :3000     │      │   :3001     │
└─────────────┘      └─────────────┘      └─────────────┘
        │                                              │
        └──────────────────────────────────────────────┘
                   API 路由由 nginx 代理到 backend
```

- 前端构建时 `NEXT_PUBLIC_API_BASE_URL=""`，浏览器请求走同域名，由 nginx 分发。
- 数据卷 `metasight-data` 挂载到 backend 的 `/data/dev.db`。
