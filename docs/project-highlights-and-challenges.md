# ChatCNU 项目亮点与重难点分析

## 1. 说明

本文基于当前代码实现（`src/`）提炼项目的：

- 亮点（工程价值高、可复用性强、可维护性好的设计）
- 重难点（实现复杂、容易出错、对稳定性影响大的部分）

目标是给团队提供一份“工程画像”：知道项目哪里做得好、哪里最值得持续投入。

---

## 2. 项目亮点（What works well）

## 2.1 Feature-First + 分层架构清晰

**代码证据**

- `src/features/**`（按业务域拆分）
- `src/views/**`（页面编排）
- `src/stores/**`（跨页面共享状态）
- `src/services/**`（底层通信能力）

**亮点是什么**

- 目录按照“业务域 + 职责层”组织，而不是纯技术类型堆文件。
- 页面层、组件层、composable 层、store 层、service 层边界清晰。

**为什么是亮点**

- 新需求更容易定位改动入口。
- 重构时可以按层替换，影响面更可控。
- 团队协作时冲突更少，认知成本更低。

---

## 2.2 流式出题 + Fallback 容灾链路（工程韧性强）

**代码证据**

- `src/services/questionCreationStream.ts`
- `src/stores/questionHistoryStore.ts`

关键逻辑（简化）：

```ts
await streamQuestionCreation({ onStart, onProgress, onDone })
```

```ts
catch (streamError) {
  await createWithFallback(requestPayload)
}
```

**亮点是什么**

- 优先走 SSE 流式接口，前端可实时显示出题进度。
- 流式失败时自动降级到普通创建接口，避免用户流程中断。

**为什么是亮点**

- 同时兼顾“体验”（实时反馈）与“成功率”（失败兜底）。
- 对网络波动、网关兼容性差异更有韧性。

---

## 2.3 统计看板“总编排器”设计成熟

**代码证据**

- `src/features/overview/composables/useOverviewStatistics.ts`

关键逻辑（简化）：

```ts
const overviewData = await fetchOverviewDashboardData(...)
const subjectDetail = await fetchOverviewSubjectDashboardData(...)
updateKpiCards(...)
updateAccuracyTrendChart(...)
updateDistributionChart(...)
```

**亮点是什么**

- 看板把“路由参数、数据拉取、KPI、图表、洞察、分享”集中在一个编排 composable 中。
- API、图表构建、展示模型、状态推导拆分为独立模块（`api/charts/presentation/state/helpers`）。

**为什么是亮点**

- 复杂业务仍保持可读性，模块职责划分清楚。
- 看板迭代（加新图、改文案、换接口）不需要大面积改动。

---

## 2.4 路由状态双向同步做了防循环处理

**代码证据**

- `src/features/overview/composables/useOverviewRouteSync.ts`

关键逻辑（简化）：

```ts
watchIgnorable(routeQuery, ...)
watchIgnorable(selectedSubject, ...)
```

**亮点是什么**

- 支持 URL query 与页面筛选状态双向同步。
- 使用 `watchIgnorable` 控制更新来源，避免互相触发造成循环。

**为什么是亮点**

- 看板状态可分享、可刷新恢复、可回退前进。
- 在“可分享 URL”与“响应式状态”之间实现了可靠桥接。

---

## 2.5 并发与竞态防护意识较强

**代码证据**

- `src/features/questions/composables/useQuestions.ts`
- `src/features/questions/composables/useAttempts.ts`
- `src/features/overview/composables/useOverviewStatistics.ts`

关键逻辑（简化）：

```ts
const controller = new AbortController()
...
if (controller === requestController) {
  isFetching.value = false
}
```

```ts
const requestId = ++latestRequestId.value
if (requestId !== latestRequestId.value) return
```

**亮点是什么**

- 通过 `AbortController` 避免旧请求回写新状态。
- 通过 `requestId` 丢弃过期响应，规避快速切换筛选时的数据污染。

**为什么是亮点**

- 这是复杂前端项目最常见的稳定性风险点，当前实现有明确防线。

---

## 2.6 “部分成功”语义处理到位

**代码证据**

- `src/features/questions/composables/useSubmit.ts`

关键逻辑（简化）：

```ts
const settledResults = await Promise.allSettled(...)
```

```ts
return { successCount, failureCount, firstError, answeredMap }
```

**亮点是什么**

- 提交答案不是简单 all-or-nothing，而是保留部分成功结果并返回统计信息。

**为什么是亮点**

- 用户在弱网场景不会因为单个请求失败而丢掉全部提交成果。
- 组件可以据此做更细粒度反馈（部分成功/完全失败）。

---

## 2.7 类型契约 + 数据归一化做得系统

**代码证据**

- `src/types/index.ts`
- `src/stores/userStore.helpers.ts`
- `src/stores/questionHistory.helpers.ts`

**亮点是什么**

- 共享模型集中定义，减少重复类型。
- 对外部输入（localStorage、后端模型代号、历史字段）做归一化处理。

**为什么是亮点**

- 降低“脏数据直接进业务逻辑”风险。
- 提高模块间交互的一致性与可预测性。

---

## 2.8 用户偏好体系完整并可持久化

**代码证据**

- `src/stores/userStore.ts`
- `src/features/layout/components/AppHeaderBar.vue`
- `src/features/profile/components/ProfilePreferencesSection.vue`

**亮点是什么**

- 深色模式、题目显示偏好、模型选择统一由 `useUserSettingsStore` 管理并持久化。
- 顶栏和 Profile 均可操作同一状态源，体验一致。

**为什么是亮点**

- 多入口设置不冲突，状态统一。
- 用户体验连续（刷新后仍保持偏好）。

---

## 3. 项目重难点（Where complexity/risk concentrates）

## 3.1 SSE 流式协议解析边界复杂

**关键代码**

- `src/services/questionCreationStream.ts`

**难点**

- SSE 事件可能分片、尾包不完整、事件顺序异常、`done` 丢失。
- 既要容错（不中断正常流），又要在关键异常时失败（避免误判成功）。

**当前处理**

- 多行 `data:` 合并、尾块补处理、`done` 校验与显式失败。

**风险点**

- 后端协议变更（字段缺失/改名）时，前端类型守卫会直接忽略事件，需要同步升级。

---

## 3.2 出题流程是“多状态机叠加”

**关键代码**

- `src/stores/questionHistoryStore.ts`

**难点**

- 同时维护 `isFetching`、`isStreaming`、`createProgress`、`donePayload`、`createError`、`hasCreatedHistory`。
- 流式成功、流式失败、fallback 成功/失败四条路径都要正确收敛状态。

**风险点**

- 任一分支漏 reset，就会出现 UI 卡住、进度错乱、侧边栏不自动选中等问题。

---

## 3.3 看板逻辑跨越“路由 + API + 图表 + 文案”多个维度

**关键代码**

- `src/features/overview/composables/useOverviewStatistics.ts`
- `src/features/overview/composables/useOverviewRouteSync.ts`

**难点**

- 同时处理全科视图/单科视图/tag 视图的状态切换。
- 同时保证 URL 同步、过期请求保护、图表数据正确映射。

**风险点**

- 一处筛选规则变化会影响 KPI、洞察、图表三处输出，回归成本高。

---

## 3.4 双向同步容易形成隐式循环和竞态

**关键代码**

- `src/features/overview/composables/useOverviewRouteSync.ts`

**难点**

- 路由变化触发状态更新，状态更新又触发路由变化，天然容易死循环。

**当前处理**

- `watchIgnorable` 区分更新来源，减少双向触发。

**风险点**

- 新增筛选字段（例如分段、难度）时若不沿用同模式，循环风险会回归。

---

## 3.5 作答面板的“题目-作答映射”一致性要求高

**关键代码**

- `src/features/questions/composables/useAnswerPanelState.ts`
- `src/features/questions/composables/useQuestionListState.ts`

**难点**

- 题目列表与尝试记录异步返回，且可能先后顺序不同。
- 需要按 `question_id` 对齐，而不是依赖数组下标。

**风险点**

- 若改成下标对齐，题目重排或接口返回顺序变化会导致答案错位。

---

## 3.6 部分成功提交语义需要 UI 全链路协同

**关键代码**

- `src/features/questions/composables/useSubmit.ts`
- `src/features/questions/components/QuestionList.vue`

**难点**

- 提交层返回 `success/failure` 混合结果后，UI 需要正确高亮、提示和进度回写。

**风险点**

- 若只关注失败提示，可能遗漏成功部分持久化，造成用户认知混乱。

---

## 3.7 用户状态与历史存储兼容迁移是隐性复杂度

**关键代码**

- `src/stores/userStore.ts`
- `src/stores/userStore.helpers.ts`

**难点**

- 既要支持新存储结构，又要兼容旧 key 并平滑迁移。
- 存储、默认值、归一化和运行时容错需要一起考虑。

**风险点**

- 迁移策略改动不慎会导致用户登录态丢失或设置回退。

---

## 3.8 安全与部署层面仍有高优先改进空间

**关键代码/配置**

- `src/stores/userStore.ts`（token 持久化）
- `src/axios.ts`（请求头注入）
- `src/config.ts`（环境变量强校验）

**难点**

- 前端 token 持久化方案与安全策略（XSS、过期、刷新）需要与后端协同设计。
- 部署环境变量（尤其 API 域名）需要强约束，避免线上不可达。

**风险点**

- 这类问题通常不影响本地开发，但会在生产环境集中暴露。

---

## 4. 结论（工程视角）

这个项目的整体工程水平在前端应用中属于“结构化良好”的类型，核心优势在于：

1. 架构分层和业务模块化做得清晰。  
2. 关键复杂链路（流式、并发、路由同步）有明确防护策略。  
3. 类型和状态治理意识较强。  

主要挑战集中在“高复杂状态编排”与“生产稳定性细节”两类问题。  
后续若继续演进，建议优先围绕这些重难点补充测试与监控能力（尤其是 overview 和流式创建链路）。
