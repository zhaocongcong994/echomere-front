# OiiOii Dify Chatflow 后端接入技术文档

版本：`1.0.0`  
更新日期：`2026-08-23`  
关联文档：《OiiOii Dify Chatflow 后端接入接口文档》

---

## 1. 总体架构

### 1.1 调用链路

```text
浏览器
  -> MetaSight 产品后端  POST /api/chat/stream
  -> Dify 平台           POST {DIFY_API_BASE_URL}/chat-messages
  -> 大模型（Moonshot / Kimi / 其他）
  -> Dify 返回 SSE
  -> MetaSight 后端解析/转换 SSE
  -> 浏览器增量显示回答
```

### 1.2 设计目标

- **API Key 保密**：`DIFY_APP_API_KEY` 只保存在服务端，不暴露给浏览器。
- **出生资料受控**：`birth_date / birth_place / birth_time / calendar_type` 必须从登录用户的服务端档案读取，禁止接受浏览器自报。
- **协议兼容**：后端将 Dify 私有 SSE 事件转换为现有前端已识别的 `meta / chunk / done` 事件，前端无需理解 Dify 细节。
- **会话延续**：产品后端保存 `conversation_id`，实现多轮对话状态保持。
- **可审计**：保存 `message_id / task_id / workflow_run_id`，用于反馈、排查和停止生成。

### 1.3 部署位置

- Dify 应用：`OiiOii 八字星盘决策陪伴 Agent - MVP Mock`
- Dify 类型：`advanced-chat` / `Chatflow`
- Dify DSL 版本：`0.7.0`

---

## 2. 模块划分与实现

### 2.1 登录与身份验证模块

**职责**：验证用户登录状态，为后续所有接口提供当前用户身份。

**实现方式**：
- 使用 JWT（`Authorization: Bearer <token>`）或 Session。
- 已改造为前后端分离架构：前端 `AuthProvider` 保存 token，每次请求带 `Authorization` 头。

**涉及接口**：
- `POST /auth/login`：邮箱/手机 + 验证码 `123456`。
- `GET /auth/me`：返回当前用户信息。

---

### 2.2 出生档案模块

**职责**：管理用户的出生时间、地点、历法类型，作为 Dify Chatflow 的输入来源。

**字段定义**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `birthDate` | string | `YYYY-MM-DD`，阳历或农历日期 |
| `birthPlace` | string | 标准地点名称，如 `北京市朝阳区` |
| `birthTime` | string | `HH:mm` 或字面值 `不知道` |
| `calendarType` | string | `solar`（公历）/ `lunar`（农历） |
| `birthTimeUnknown` | boolean | 是否不知道具体时辰 |

**映射到 Dify inputs**：

| 产品后端字段 | Dify `inputs` 字段 | 转换规则 |
|------|------|------|
| `profile.birthDate` | `birth_date` | 原样传递 `YYYY-MM-DD` |
| `profile.birthPlace.standardName` | `birth_place` | 原样传递，最长 128 字符 |
| `profile.birthTimeUnknown = true` | `birth_time` | 固定为 `"不知道"` |
| `profile.birthTime` | `birth_time` | 原样传递 `HH:mm` |
| `profile.calendarType = solar` | `calendar_type` | `"公历"` |
| `profile.calendarType = lunar` | `calendar_type` | `"农历"` |

**涉及接口**：
- `GET /profile`：读取当前用户主档案。
- `POST /onboarding`：首次登录时创建主档案。
- `POST /profiles`：新增档案（自己/他人）。
- `PATCH /profiles/:id`：修改档案并重算八字。

**校验规则**：
- `birth_date` 不得为未来日期。
- `birth_time` 不得自动补成 `12:00` 等默认值。
- `birth_place` 必须使用标准地名，不能用歧义值。
- `birth_place` 或 `calendar_type` 缺失时，必须阻止进入 Chatflow，引导用户补全资料。

---

### 2.3 Chat Stream 模块（核心）

**职责**：接收前端聊天请求，调用 Dify，解析 SSE 并转发给前端。

**处理顺序**：

```text
1. 验证登录 Session
2. 校验本地 conversation 属于当前用户
3. 从数据库加载出生档案
4. 校验 birth_date / birth_place / birth_time / calendar_type
5. 生成稳定伪匿名 Dify user
6. 加载本地 dify_conversation_id
7. 服务端调用 Dify /chat-messages
8. 解析 Dify SSE，转换为现有前端事件格式
9. 尽早保存 conversation_id、task_id、workflow_run_id
10. 保存最终回答或失败状态
```

**涉及接口**：
- `POST /api/chat/stream`

**请求体**：

```json
{
  "message": "我到底该不该辞职？",
  "mode": "suiyuan",
  "conversationId": "本地会话ID"
}
```

**响应**：SSE 流，事件格式保持与现有前端一致：

```text
event: meta
data: {"conversationId":"...","mode":"...","routeReason":"..."}

event: chunk
data: {"content":"你现在最担心的是"}

event: done
data: {}
```

---

### 2.4 Dify Client 模块

**职责**：封装对 Dify API 的 HTTP 调用，包括超时、重试、错误处理。

**环境变量**：

```env
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_APP_API_KEY=<DIFY_APP_API_KEY>
DIFY_REQUEST_TIMEOUT_MS=120000
```

**核心函数**：

| 函数 | 调用 | 说明 |
|------|------|------|
| `sendChatMessage(inputs, query, conversationId, user)` | `POST /chat-messages` | 发送消息并返回 SSE 流 |
| `stopGeneration(taskId, user)` | `POST /chat-messages/{task_id}/stop` | 停止当前生成 |

**重试策略**：
- 仅对 Dify `500` 或临时 `429` 做指数退避重试。
- 最多 2 次重试，退避时间 `500ms`、`1500ms`。
- `400 / 401 / 403 / 404` 不重试。
- 用户主动发送的消息需做幂等保护，避免重复回答。

---

### 2.5 会话绑定模块

**职责**：将产品本地会话与 Dify 会话关联，实现多轮对话延续。

**数据库字段（在 `Conversation` 表中扩展）**：

| 字段 | 类型 | 用途 |
|------|------|------|
| `difyConversationId` | string / null | 延续 Dify 多轮对话 |
| `difyLastMessageId` | string / null | 反馈、排查和审计 |
| `difyLastTaskId` | string / null | 停止当前流式任务 |
| `difyWorkflowRunId` | string / null | 查询或恢复一次工作流运行 |

**规则**：
1. 首轮请求 `conversation_id` 为空。
2. 从首个包含 `conversation_id` 的 Dify 事件中立即保存它。
3. 后续消息必须使用本地会话绑定的 `dify_conversation_id`。
4. 本地会话必须同时属于当前登录用户，否则返回 `403`。
5. 不允许用户 A 提交用户 B 的 Dify 会话 ID。

---

### 2.6 排盘与星盘计算模块

**当前状态（MVP Mock）**：
- Dify Chatflow 内部 `S4-S5 双盘Mock与检查` 节点使用 Mock 数据，不计算真实八字或星盘。
- 出生资料会进入 Dify 输入和日志，测试时只能使用虚构数据。

**正式上线前改造**：
- 产品后端提供真实排盘服务，Dify 通过 HTTP 节点或工具调用反向调用。
- 排盘结果（八字四柱、日主、十神、五行、星盘数据）由产品后端计算后注入 Dify 工作流。

**涉及接口（产品后端提供）**：
- `POST /bazi`：根据出生时间计算八字。
- `GET /daily-fortune`：根据八字计算每日运势。
- `GET /nebula/chart`：星云图数据。

**涉及 Dify 反向调用接口（需补充 OpenAPI 契约）**：
- `POST /api/bazi/calculate`：Dify 请求排盘。
- `POST /api/astrology/chart`：Dify 请求星盘。

---

### 2.7 决策卡与长期记忆模块

**当前状态（MVP）**：
- 命盘、授权状态和决策卡主要保存在 Dify Conversation Variables 中，不是正式数据源。

**正式上线前改造**：
- 产品后端提供档案服务、记忆服务、决策卡服务。
- Dify 通过 HTTP 节点在产品后端读取/写入。

**涉及接口（产品后端提供）**：
- `GET /profiles`：读取所有档案。
- `POST /decision-cards`：创建决策卡。
- `GET /decision-cards`：读取历史决策卡。
- `POST /memories`：写入长期记忆。
- `GET /memories`：读取长期记忆。

---

## 3. 接口详细设计

### 3.1 产品后端接口

#### 3.1.1 发送聊天消息

**POST** `/api/chat/stream`

**请求头**：

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**：

```json
{
  "message": "我到底该不该辞职？",
  "mode": "suiyuan",
  "conversationId": "本地会话ID"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `message` | string | 是 | 用户当前问题 |
| `mode` | string | 是 | `suiyuan` / `kanyun` / `qingting` / `wenshi` |
| `conversationId` | string | 否 | 本地会话 ID，不传则新建 |

**响应**：SSE 流

```text
Content-Type: text/event-stream

event: meta
data: {"conversationId":"local_xxx","difyConversationId":"dify_xxx","mode":"kanyun","routeReason":"根据问题语义，已为你匹配「看运」模式"}

event: chunk
data: {"content":"你现在最担心的是"}

event: chunk
data: {"content":"收入、成长还是团队关系？"}

event: done
data: {}
```

**错误响应**：

```json
{ "error": "NO_PROFILE", "message": "需要先建立命盘档案" }
{ "error": "UNAUTHORIZED", "message": "未登录" }
{ "error": "FORBIDDEN", "message": "无权访问该会话" }
{ "error": "DIFY_ERROR", "message": "Dify 服务异常" }
```

---

#### 3.1.2 停止生成

由 `POST /api/chat/stream` 内部在收到用户停止指令后调用，前端不直接请求 Dify。

---

#### 3.1.3 读取出生档案

**GET** `/profile`

**响应**：

```json
{
  "user": { /* User 对象 */ },
  "primaryProfile": {
    "birthDateTime": "1995-05-20T14:30:00.000Z",
    "birthLocation": "北京市朝阳区",
    "calendarType": "solar",
    "gender": "male"
  },
  "bazi": { /* 八字计算结果 */ }
}
```

---

### 3.2 Dify 平台接口

#### 3.2.1 发送聊天消息

**POST** `{DIFY_API_BASE_URL}/chat-messages`

**请求头**：

```http
Authorization: Bearer <DIFY_APP_API_KEY>
Content-Type: application/json
Accept: text/event-stream
```

**请求体**：

```json
{
  "inputs": {
    "birth_date": "1995-05-20",
    "birth_place": "北京市朝阳区",
    "birth_time": "14:30",
    "calendar_type": "公历"
  },
  "query": "我到底该不该辞职？",
  "response_mode": "streaming",
  "conversation_id": "",
  "user": "user_7f5c8c7e"
}
```

**响应**：SSE 流

常见事件顺序：

```text
ping
workflow_started
node_started / node_finished
message
message_end
workflow_finished
```

后端最少处理：

| event | 处理 |
|-------|------|
| `message` | 追加 `answer` 并转发 |
| `message_end` | 保存 `message_id`、`conversation_id`、用量 |
| `workflow_finished` | 检查 `data.status` |
| `error` | 记录 code，返回安全错误信息 |
| `ping` | 忽略，维持连接 |

#### 3.2.2 停止生成

**POST** `{DIFY_API_BASE_URL}/chat-messages/{task_id}/stop`

**请求体**：

```json
{
  "user": "user_7f5c8c7e"
}
```

**响应**：

```json
{
  "result": "success"
}
```

---

### 3.3 产品后端供 Dify 调用的接口（推荐补充）

为了让 Dify Chatflow 在正式上线时使用真实排盘与档案，建议产品后端暴露以下 OpenAPI 接口供 Dify HTTP 节点调用：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/internal/bazi` | POST | 根据出生资料计算八字 |
| `/api/internal/astrology` | POST | 根据出生资料计算西方星盘 |
| `/api/internal/profile` | GET | 查询当前用户主档案 |
| `/api/internal/decision-cards` | GET/POST | 查询/创建决策卡 |
| `/api/internal/memories` | GET/POST | 查询/写入长期记忆 |

这些接口需要验证 Dify 内部调用身份（如共享 Secret 或 IP 白名单），不直接暴露给浏览器。

---

## 4. 数据存储

### 4.1 数据库选型

| 阶段 | 推荐数据库 | 说明 |
|------|-----------|------|
| MVP / 测试期 | SQLite | 零运维，适合快速验证 |
| 正式上线 | PostgreSQL | 支持高并发、事务、JSON 字段、备份恢复 |
| 大规模 | PostgreSQL + Redis | Redis 用于会话缓存、限流、热点数据 |

当前 MetaSight MVP 使用 **SQLite**，数据文件位于 Docker 卷 `/var/lib/docker/volumes/metasight-data/_data/dev.db`。

### 4.2 数据表设计

建议核心表如下：

#### `User` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 用户唯一 ID |
| `email` | string / unique | 邮箱 |
| `phone` | string / unique | 手机号 |
| `name` | string | 昵称 |
| `locale` | string | 语言，默认 `zh` |
| `defaultDestinySystem` | string | 默认命理体系，默认 `bazi` |
| `createdAt` | datetime | 创建时间 |
| `updatedAt` | datetime | 更新时间 |

#### `Profile` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 档案 ID |
| `userId` | string (FK) | 所属用户 |
| `type` | string | `self` / `others` |
| `name` | string | 档案名称 |
| `gender` | string | `male` / `female` / `other` |
| `birthDateTime` | datetime | 出生时间 |
| `birthLocation` | string | 出生地点 |
| `isPrimary` | boolean | 是否主命盘 |
| `baziPillar` | json/text | 八字计算结果 JSON |
| `calendarType` | string | `solar` / `lunar` |
| `createdAt` | datetime | 创建时间 |
| `updatedAt` | datetime | 更新时间 |

#### `Conversation` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 本地会话 ID |
| `userId` | string (FK) | 所属用户 |
| `mode` | string | `suiyuan` / `kanyun` / `qingting` / `wenshi` |
| `title` | string | 会话标题 |
| `status` | string | `active` / `archived` |
| `messageCount` | int | 消息数 |
| `difyConversationId` | string | Dify 会话 ID |
| `difyLastMessageId` | string | Dify 最后消息 ID |
| `difyLastTaskId` | string | Dify 任务 ID |
| `difyWorkflowRunId` | string | Dify 工作流运行 ID |
| `createdAt` | datetime | 创建时间 |
| `updatedAt` | datetime | 更新时间 |

#### `Message` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 消息 ID |
| `conversationId` | string (FK) | 所属会话 |
| `userId` | string (FK) | 发送用户 |
| `role` | string | `user` / `assistant` |
| `content` | text | 消息内容 |
| `toolCalls` | json | 工具调用结果 |
| `thinkingSummary` | string | 思考摘要 |
| `difyMessageId` | string | Dify 消息 ID |
| `createdAt` | datetime | 创建时间 |

#### `DecisionCard` 表（可选）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 决策卡 ID |
| `userId` | string (FK) | 所属用户 |
| `conversationId` | string (FK) | 关联会话 |
| `question` | text | 问题 |
| `hexagram` | json | 六爻卦象 |
| `advice` | text | 建议 |
| `createdAt` | datetime | 创建时间 |

#### `Memory` 表（可选）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 记忆 ID |
| `userId` | string (FK) | 所属用户 |
| `key` | string | 记忆键 |
| `value` | text | 记忆内容 |
| `createdAt` | datetime | 创建时间 |

#### `BillingRecord` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (PK) | 记录 ID |
| `userId` | string (FK) | 所属用户 |
| `type` | string | `interpretation` / `subscription` / `topup` |
| `amount` | int | 金额（分），正收入负支出 |
| `currency` | string | 默认 `CNY` |
| `description` | string | 描述 |
| `conversationId` | string | 关联会话 |
| `status` | string | `completed` / `pending` / `failed` |
| `createdAt` | datetime | 创建时间 |

### 4.3 数据存储方式

1. **出生资料**：以结构化字段存储在 `Profile` 表，建议对敏感字段（如精确出生时间、地点）做加密存储。
2. **八字/星盘计算结果**：以 JSON 形式存储在 `Profile.baziPillar`，避免每次重复计算。
3. **聊天记录**：本地 `Message` 表保存用户消息和最终 AI 回答；Dify 中间节点信息不保存，仅保留 `difyMessageId` 用于追溯。
4. **Dify 会话绑定**：`Conversation` 表扩展 4 个字段，建立本地会话与 Dify 会话的映射。
5. **决策卡与记忆**：产品后端持久化，Dify 通过 HTTP 节点读写，避免全部依赖 Dify Conversation Variables。
6. **备份**：生产环境至少每日备份 SQLite/PostgreSQL 数据文件，敏感数据备份需加密。

### 4.4 数据安全

- 出生日期、时间、地点属于敏感个人信息，生产环境必须 HTTPS 传输。
- 数据库连接使用独立账号，最小权限原则。
- 测试环境禁止使用真实出生资料。
- 日志中不得打印 `DIFY_APP_API_KEY`、用户 token、完整出生资料。

---

## 5. 费用估算

### 5.1 Dify 平台费用

Dify 提供 Cloud 和私有部署两种模式：

| 模式 | 费用类型 | 说明 |
|------|---------|------|
| Dify Cloud | 按量计费 | 根据工作流运行次数、Token 消耗计费；具体价格参考 Dify 官网定价页 |
| Dify Cloud | 套餐订阅 | 通常有免费额度、专业版、团队版等档位 |
| 私有部署 | 服务器成本 | 需要自行准备服务器、数据库、域名、SSL 证书 |
| 私有部署 | 运维成本 | 需要维护 Dify 版本升级、监控、备份 |

### 5.2 大模型费用

Dify 工作流最终调用大模型，费用由模型供应商收取：

| 模型 | 计费方式 | 说明 |
|------|---------|------|
| Moonshot | 按 Token | 输入 + 输出 Token 分别计价 |
| Kimi | 按 Token | 输入 + 输出 Token 分别计价 |
| OpenAI GPT | 按 Token | 海外模型，需考虑网络稳定性 |

### 5.3 数据库与服务器费用

| 组件 | 估算（月） | 说明 |
|------|-----------|------|
| 云服务器（1 核 2G） | ￥50 - 200 | 适合 MVP |
| 云服务器（2 核 4G） | ￥200 - 500 | 适合小规模正式运行 |
| PostgreSQL 托管 | ￥100 - 1000 | 根据规格和备份策略 |
| 对象存储（头像/附件） | 按量 | 少量数据可忽略 |
| 域名 + SSL 证书 | ￥0 - 500/年 | Let's Encrypt 免费 |

### 5.4 综合建议

- MVP 阶段：使用 Dify Cloud 免费额度 + SQLite + 低配服务器，验证产品价值。
- 测试阶段：使用 Dify Cloud 专业版 + PostgreSQL + 中等配置服务器。
- 正式阶段：评估 Dify Cloud 与私有部署的总成本，根据用户量和数据隐私要求选择。

---

## 6. 最小验收清单

后端接入完成后至少验证：

- [ ] 首轮使用空 `conversation_id` 能收到 `message` 和终止事件。
- [ ] 后端保存 Dify 返回的 `conversation_id`。
- [ ] 第二轮使用同一 `conversation_id`，Dify 能延续状态。
- [ ] 四个出生字段均来自服务端档案，而不是浏览器自报字段。
- [ ] `birth_time = 不知道` 时未被替换为默认时间。
- [ ] `birth_place` 或 `calendar_type` 缺失时阻止调用，不伪造默认值。
- [ ] 无效 API Key 能转换成产品侧可识别的配置错误。
- [ ] 流内 `error` 或 `workflow_finished.status = failed` 能正确结束网页流。
- [ ] 用户只能继续自己的本地会话。
- [ ] 浏览器网络请求中看不到 Dify API Key。

---

## 7. 参考资料

- 《OiiOii Dify Chatflow 后端接入接口文档》
- [Dify：Send Chat Message](https://docs.dify.ai/en/api-reference/chat-messages/send-chat-message)
- [Dify：Consume Streaming Responses](https://docs.dify.ai/en/api-reference/guides/streaming)
- [Dify：End User Identity](https://docs.dify.ai/en/api-reference/guides/end-user-identity)
- [Dify：Handle Errors and Rate Limits](https://docs.dify.ai/en/api-reference/guides/errors)
- [Dify：Stop Chat Message Generation](https://docs.dify.ai/en/api-reference/chat-messages/stop-chat-message-generation)
