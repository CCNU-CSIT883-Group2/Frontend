/**
 * 文件说明（是什么）：
 * - 本文件是「Vue 类型补充声明」。
 * - 为 TypeScript 提供 Vue SFC 的模块声明与编译期类型支持。
 *
 * 设计原因（为什么）：
 * - 让编译器正确识别 `.vue` 文件，避免类型系统与构建流程脱节。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

// shims-vue.d.ts
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
