# ChatCNU 项目代码审查（不完善点）

## 审查范围
- 代码目录：`src/`、`docs/`、配置文件（`package.json`、`.env.*`、`README.md`）
- 质量检查：`pnpm run type-check`、`pnpm run build-only`、`pnpm exec eslint .`（均通过）

## 结论摘要
当前项目能正常构建，但存在若干会影响线上稳定性、安全性和可维护性的缺口，尤其在历史记录响应式更新、密码找回流程完整性、生产环境配置方面。

## 发现清单（按严重级别）

### P1（高）

1. 历史记录使用 `shallowRef` 却进行原地数组修改，可能导致 UI 不刷新
- 位置：`src/stores/questionHistoryStore.ts:28`, `src/stores/questionHistoryStore.ts:74`, `src/stores/questionHistoryStore.ts:78`
- 问题：`histories` 是 `shallowRef<History[]>`，但 `upsertHistory` 使用 `histories.value[existingIndex] = ...` 和 `push(...)`。`shallowRef` 对内部对象/数组的原地变更不会触发响应式更新。
- 影响：新建题单后，侧边栏历史列表可能不立即更新，用户要等下一次全量拉取才看到变化。
- 建议：改为不可变更新（整体替换 `histories.value`）或改成 `ref`/`reactive` 并保持一致的更新策略。

2. 密码找回流程仍是 mock 逻辑，存在硬编码验证码
- 位置：`src/views/BackPasswordView.vue:180`, `src/views/BackPasswordView.vue:188`, `src/views/BackPasswordView.vue:214`
- 问题：验证码写死为 `123456`，且“发送验证码/修改密码”未调用后端。
- 影响：功能在真实环境不可用；若误上线会形成明显安全风险。
- 建议：接入后端接口（发送验证码、校验验证码、重置密码），移除硬编码验证逻辑。

3. 生产环境 API 地址配置为本机 `localhost`
- 位置：`.env.production:1`
- 问题：`VITE_SERVER_BASE_URL=http://localhost:8000`
- 影响：前端部署到服务器后，浏览器会请求用户本地 `localhost:8000`，线上 API 实际不可达。
- 建议：改为真实可访问的生产 API 域名，并在部署管道中显式注入环境变量。

### P2（中）

4. 提交答案的失败信息被吞掉，用户侧没有可见反馈
- 位置：`src/features/questions/composables/useSubmit.ts:19`, `src/features/questions/composables/useSubmit.ts:39`, `src/features/questions/components/QuestionList.vue:126`, `src/features/questions/components/QuestionList.vue:135`
- 问题：`useSubmit` 虽记录了 `error`，但 `QuestionList` 未消费该错误并提示用户。
- 影响：网络失败时，用户只会看到题目“未完成”，不知道失败原因，误以为是操作问题。
- 建议：在提交失败时显示 toast/message，并区分“部分成功/全部失败”。

5. 令牌持久化在 `localStorage`，存在 XSS 后被窃取风险
- 位置：`src/stores/userStore.ts:31`, `src/stores/userStore.ts:41`, `src/axios.ts:28`
- 问题：token 长期存储在 `localStorage`，每次请求从本地读取并注入头部。
- 影响：一旦页面存在 XSS，token 易被读取并滥用。
- 建议：优先改为 HttpOnly + Secure Cookie；至少增加 token 过期处理和严格 CSP。

6. `errorMessage` 同时承载“错误”和“分享成功兜底提示”，语义混乱
- 位置：`src/features/overview/composables/useOverviewStatistics.ts:797`, `src/views/OverviewView.vue:26`
- 问题：复制链接成功时仍写入 `errorMessage`，页面以 `severity="error"` 渲染。
- 影响：用户会看到错误红条，误判系统异常。
- 建议：拆分状态（`errorMessage` / `infoMessage`），或改为 Toast 展示非错误提示。

7. 个人资料页面存在固定宽度，移动端适配不足
- 位置：`src/views/ProfileView.vue:7`
- 问题：使用 `w-[800px]` 固定宽度。
- 影响：小屏设备可能出现横向溢出，阅读和编辑体验差。
- 建议：改为响应式宽度（如 `w-full max-w-...`）并补充移动端断点样式。

### P3（低）

8. 工程文档仍是 Vite 模板，缺少项目级说明
- 位置：`README.md:1`
- 问题：README 未描述本项目业务、环境变量、接口约定、启动流程。
- 影响：新成员上手成本高，部署与联调容易踩坑。
- 建议：补充项目简介、环境变量说明、API 依赖、常见问题、发布流程。

9. 缺少自动化测试（单测/组件测试/E2E）
- 位置：项目内未发现 `*.spec.*` / `*.test.*` 文件
- 问题：目前质量保障主要依赖手工和构建通过。
- 影响：重构后回归风险高，关键流程（登录、出题、提交、统计）缺乏自动守护。
- 建议：至少为关键 composable/store 建立单测，并为登录与做题流程添加基础 E2E。

10. `lint` 脚本默认带 `--fix`，不利于 CI 稳定兜底
- 位置：`package.json:12`
- 问题：`pnpm lint` 会直接改文件，不是纯检查命令。
- 影响：CI/预提交场景下难以明确“检查失败”与“自动改写”的边界。
- 建议：拆分 `lint`（只检查）与 `lint:fix`（自动修复）两个脚本。

## 建议优先级（执行顺序）
1. 先修 P1（历史记录响应式、密码找回真实化、生产 API 配置）
2. 再修 P2（错误提示链路、安全策略、移动端适配）
3. 最后补 P3（文档与测试基线、脚本规范）
