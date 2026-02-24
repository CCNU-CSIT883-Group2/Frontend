# ChatCNU Frontend

ChatCNU 的前端项目，基于 Vue 3 + Vite + TypeScript 构建，提供登录/注册、题目练习、学习总览、个人中心等页面能力。

## 技术栈

- Vue 3（Composition API + `<script setup lang="ts">`）
- Vite 7
- TypeScript 5
- Vue Router 4（Hash 路由）
- Pinia
- PrimeVue + Tailwind CSS
- Chart.js + ECharts
- Axios

## 环境要求

- Node.js：建议使用仓库内版本（见 `.nvmrc`）
- pnpm：建议 `>=10`

推荐使用：

```bash
nvm use
corepack enable
```

## 快速开始

```bash
pnpm install
pnpm dev
```

默认启动后访问：`http://localhost:5173`

## 环境变量

项目在运行时必须提供以下变量：

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| `VITE_SERVER_BASE_URL` | 是 | 后端 API 基础地址 |

示例（仓库已提供 `.env.development` / `.env.production`）：

```env
VITE_SERVER_BASE_URL=https://cl.lzzzt.cc/api
```

## 可用脚本

```bash
# 本地开发（热更新）
pnpm dev

# 生产构建
pnpm build

# 构建产物本地预览
pnpm preview

# TypeScript 类型检查
pnpm type-check

# ESLint（包含自动修复）
pnpm lint

# Prettier 格式化 src/
pnpm format
```

## 项目结构

```text
src/
  main.ts                     # 应用入口（插件注册、挂载）
  App.vue                     # 根布局
  router/                     # 路由与导航守卫
  stores/                     # Pinia 状态（用户、题单历史等）
  services/                   # 服务层（如流式创建题目）
  features/
    auth/                     # 登录/注册/找回密码
    questions/                # 题目练习域
    overview/                 # 学习统计与图表
    profile/                  # 用户资料域
    layout/                   # 布局组件
  views/                      # 路由页面
  types/                      # 共享类型定义
```

更多架构说明见：`docs/project-structure-architecture.md`

## 请求与鉴权约定

- 请求统一通过 `src/axios.ts` 发起。
- `Authorization` 头由请求拦截器自动注入（公开接口如 `/login`、`/register` 自动跳过）。
- API 地址来源于 `VITE_SERVER_BASE_URL`，缺失时应用会在启动时报错。

## 构建说明

- `vite.config.ts` 已配置 `manualChunks`，将大体积依赖拆分为多个 vendor chunk，降低主包体积并避免默认大包告警。
- 构建输出目录：`dist/`。

## 常见问题

### 1) 出现 Browserslist 数据过期警告

执行：

```bash
pnpm dlx update-browserslist-db@latest
```

### 2) `components.d.ts` 发生变化

该文件由 `unplugin-vue-components` 生成，依赖升级或组件扫描变化时更新是正常现象。

### 3) API 请求失败

优先检查：

- `.env.*` 中 `VITE_SERVER_BASE_URL` 是否正确
- 后端服务是否可访问
- 登录态 token 是否存在且有效
