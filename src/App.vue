<template>
  <div class="h-screen flex flex-col m-0 bg-surface-0 dark:bg-surface-950">
    <AppHeaderBar />
    <div
      class="flex-1 overflow-y-scroll w-full h-full pt-14 text-surface-950 dark:text-surface-0 no-scrollbar flex"
    >
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「应用根组件」。
 * - 承载全局布局和路由出口，组织顶层页面结构。
 *
 * 设计原因（为什么）：
 * - 将全局壳层与业务页面解耦，保证路由切换与全局 UI 行为一致。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import AppHeaderBar from '@/features/layout/components/AppHeaderBar.vue'
</script>
