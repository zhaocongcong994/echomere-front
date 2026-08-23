# Dify Chatflow 联调交付清单

版本：`1.0.0`  
更新日期：`2026-08-23`  
用途：供 Dify Agent 负责人按清单补充交付物，确保后端可安全接入  

---

## 背景

当前产品后端需要接入 Dify Chatflow（`OiiOii 八字星盘决策陪伴 Agent - MVP Mock`），由产品后端封装 Dify 调用并暴露给前端。

现有接口文档已描述调用方式，但缺少与 Dify 实际配置的核对信息，直接开发存在字段不匹配、接口不通的风险。

---

## 必须交付项

### 1. Dify Chatflow DSL 导出文件 或 开始节点截图

**用途**：确认 `inputs` 中真实变量名、类型、必填项是否与接口文档一致。

**需要确认的内容**：

| 文档约定字段 | 需要确认 | 说明 |
|---|---|---|
| `birth_date` | Dify 实际变量名是否一致 | 可能是 `birthDate`、`出生日期` 等 |
| `birth_place` | Dify 实际变量名是否一致 | 可能是 `birthPlace`、`出生地` 等 |
| `birth_time` | Dify 实际变量名是否一致 | 可能是 `birthTime`、`出生时辰` 等 |
| `calendar_type` | Dify 实际变量名是否一致 | 可能是 `calendarType`、`历法` 等 |
| 变量类型 | string / select / object | 影响后端传值方式 |
| 是否必填 | 是 / 否 | 影响后端校验逻辑 |
| 允许取值 | 如 `公历/农历` 或 `solar/lunar` | 影响映射规则 |

**交付形式**：
- 推荐：导出 `.dsl` 文件或 YAML 配置。
- 备选：开始节点设置页面的完整截图。

---

### 2. 输入变量清单表

以表格形式给出 Dify Chatflow 开始节点的全部输入变量：

| Dify 变量名 | 显示名称 | 类型 | 必填 | 默认值 | 允许取值 | 示例值 |
|---|---|---|---|---|---|---|
| （待补充） | | | | | | |

---

### 3. 可跑通的 curl 示例

用一个真实可用的 API Key 提供至少一个能返回正确 SSE 的 curl 命令：

```bash
curl --no-buffer \
  --request POST \
  --url "${DIFY_API_BASE_URL}/chat-messages" \
  --header "Authorization: Bearer ${DIFY_APP_API_KEY}" \
  --header "Content-Type: application/json" \
  --header "Accept: text/event-stream" \
  --data '{
    "inputs": { ... },
    "query": "...",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "..."
  }'
```

**要求**：
- 必须能实际运行并收到 `message` / `message_end` / `workflow_finished` 事件。
- 出生资料必须使用虚构数据。
- 请附带期望的 SSE 输出片段。

---

### 4. 反向调用接口 OpenAPI 契约文件

即现有接口文档中提到的 `api-contracts.openapi.yaml` 完整内容。

**需要覆盖的接口**：

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/bazi/calculate` | POST | Dify 请求八字排盘 |
| `/api/astrology/chart` | POST | Dify 请求西方星盘 |
| `/api/profile` | GET | Dify 查询当前用户主档案 |
| `/api/decision-cards` | GET/POST | Dify 查询/创建决策卡 |
| `/api/memories` | GET/POST | Dify 查询/写入长期记忆 |

**每份契约需包含**：
- 请求路径、方法、认证方式
- 请求头、请求体字段、类型、必填项
- 响应体字段、类型、示例
- 错误码和错误响应示例

---

### 5. Chatflow 自定义输出事件说明

除了标准 Dify SSE 事件（`ping / workflow_started / node_started / node_finished / message / message_end / workflow_finished / error`），请说明 Chatflow 是否还会输出：

| 输出内容 | 出现的事件 | 字段路径 | 示例 |
|---|---|---|---|
| 模式路由原因 | | | 如 `"已为你匹配看运模式"` |
| 决策卡 JSON | | | |
| 八字/星盘结果 | | | |
| 阶段状态 `phase` | | | |
| 其他业务字段 | | | |

---

### 6. 测试用例文档

覆盖以下场景：

| 编号 | 场景 | 输入 | 期望结果 |
|---|---|---|---|
| TC01 | 首轮对话 | `conversation_id` 为空，档案完整 | 收到正常 SSE，返回 `conversation_id` |
| TC02 | 多轮延续 | 使用上轮 `conversation_id` | Dify 能延续上下文和 `phase` 状态 |
| TC03 | 时辰未知 | `birth_time = "不知道"` | Dify 不报错，不使用默认时间 |
| TC04 | 档案缺失 | `birth_place` 或 `calendar_type` 为空 | 产品后端阻止调用，Dify 不被请求 |
| TC05 | 停止生成 | 用户点击停止 | 调用 `/chat-messages/{task_id}/stop` 成功 |
| TC06 | 无效 API Key | 使用错误 Key | 返回 401，不暴露密钥 |
| TC07 | 流内错误 | Dify 节点失败 | `workflow_finished.status = failed` 被正确捕获 |
| TC08 | 会话隔离 | 用户 A 请求用户 B 的会话 | 产品后端返回 403 |

---

### 7. Dify 应用访问信息

| 配置项 | 说明 |
|---|---|
| Dify 部署地址 | Cloud 或私有部署的 `/v1` 地址 |
| 应用类型 | `advanced-chat` / `chatflow` / `workflow` |
| DSL 版本 | 如 `0.7.0` |
| API Key 获取位置 | 应用 "访问 API" 页面截图或路径 |
| 测试账号 | 如需要登录 Dify 后台查看配置 |
| 环境要求 | 是否需要 VPN、内网、特定 DNS 等 |

---

## 建议交付顺序

```text
第 1 步：提供 DSL 文件 / 开始节点截图 + 输入变量清单表
         ↓ 产品后端核对字段名、类型、必填项
第 2 步：提供可跑通的 curl 示例
         ↓ 产品后端验证调用链路通不通
第 3 步：提供反向调用 OpenAPI 契约
         ↓ 产品后端实现 Dify 反向调用接口
第 4 步：提供自定义输出事件说明 + 测试用例
         ↓ 产品后端完成 SSE 解析和前端协议转换
第 5 步：联调验收
```

---

## 未收到完整交付前的风险

| 缺失项 | 可能导致的问题 |
|---|---|
| DSL / 开始节点截图 | 后端按文档字段调用，Dify 返回 `400 invalid_param` |
| 可跑通 curl | 无法确认是字段问题、网络问题还是 Key 问题 |
| 反向调用 OpenAPI | Dify HTTP 节点调产品后端时字段对不上，工作流失败 |
| 自定义输出说明 | 前端收不到模式路由、决策卡等业务数据 |
| 测试用例 | 边界场景遗漏，上线后出异常 |

---

## 联系人

- 产品后端负责人：
- Dify Agent 负责人：
- 预计补充日期：
