<template>
  <ProfileWorkspace />
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「路由视图组件」。
 * - 负责页面级编排，组合子组件并衔接路由上下文（模块：ProfileView）。
 *
 * 设计原因（为什么）：
 * - 将页面容器职责与可复用业务组件分离，便于扩展页面能力与路由演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import ProfileWorkspace from '@/features/profile/components/ProfileWorkspace.vue'
</script>
