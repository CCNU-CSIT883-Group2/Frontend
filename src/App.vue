<template>
  <!-- 根容器：全屏高度，flex 纵向布局，深色模式背景自适应 -->
  <div class="h-screen flex flex-col m-0 bg-surface-0 dark:bg-surface-950">
    <!-- 固定顶部导航栏（高度 14，约 56px） -->
    <AppHeaderBar />
    <!--
      主内容区：
      - flex-1 撑满剩余高度；
      - overflow-y-scroll 允许内容滚动；
      - pt-14 为固定定位的 AppHeaderBar 预留空间；
      - no-scrollbar 隐藏滚动条（保留功能，仅隐藏视觉）；
      - flex 让子路由视图能够通过 flex-1 撑满高度。
    -->
    <div
      class="flex-1 overflow-y-scroll w-full h-full pt-14 text-surface-950 dark:text-surface-0 no-scrollbar flex"
    >
      <!-- 路由出口：渲染当前路由匹配的视图组件 -->
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
