/**
 * 文件说明（是什么）：
 * - 本文件是「Vite 构建配置」。
 * - 配置开发服务器、构建行为与插件链。
 *
 * 设计原因（为什么）：
 * - 把构建策略统一收口，便于在不同环境下稳定复用同一套构建规则。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

/**
 * 将第三方依赖按技术栈拆分到稳定的 vendor chunk。
 *
 * 目的：
 * 1. 降低入口 chunk 体积，避免触发 500 kB 警告；
 * 2. 让缓存粒度更细（例如仅 PrimeVue 变更时不影响 Vue 核心缓存）；
 * 3. 保持 chunk 命名可读，便于后续定位体积回归。
 */
const resolveVendorChunk = (id: string) => {
  const normalizedId = id.replace(/\\/g, '/')
  if (!normalizedId.includes('/node_modules/')) {
    return undefined
  }

  // 体积较大的图表库单独拆分，避免和业务入口耦合。
  if (normalizedId.includes('/echarts/')) {
    return 'vendor-echarts'
  }
  if (normalizedId.includes('/chart.js/')) {
    return 'vendor-chartjs'
  }

  // PrimeVue 组件与主题体系体积较大，拆成两个 chunk 便于缓存与按需加载。
  if (normalizedId.includes('/@primeuix/')) {
    return 'vendor-prime-theme'
  }
  if (
    normalizedId.includes('/primevue/') ||
    normalizedId.includes('/@primevue/') ||
    normalizedId.includes('/primeicons/')
  ) {
    return 'vendor-primevue'
  }

  // Vue 核心生态独立，减少与 UI 库更新的耦合。
  if (
    normalizedId.includes('/vue-router/') ||
    normalizedId.includes('/pinia/') ||
    normalizedId.includes('/@vueuse/') ||
    normalizedId.includes('/vue/') ||
    normalizedId.includes('/@vue/')
  ) {
    return 'vendor-vue-ecosystem'
  }

  // 其余第三方依赖合并到通用 vendor chunk。
  return 'vendor-misc'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [PrimeVueResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: resolveVendorChunk,
      },
    },
  },
})
