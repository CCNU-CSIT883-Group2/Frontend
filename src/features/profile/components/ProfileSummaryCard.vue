<template>
  <!-- 卡片容器：圆角边框、白色/深色背景、轻阴影 -->
  <aside
    class="overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 shadow-sm dark:border-surface-700 dark:bg-surface-900">
    <!-- 渐变头部：从浅灰到白的渐变背景，承载头像与基本信息 -->
    <div
      class="bg-gradient-to-br from-surface-100 via-surface-50 to-surface-0 px-5 py-6 dark:from-surface-800 dark:via-surface-900 dark:to-surface-900">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <!-- 头像区：纯色背景 + 首字母缩写（最多 2 个字符），深色模式下反色 -->
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-900 text-lg font-semibold text-surface-0 dark:bg-surface-0 dark:text-surface-900">
            {{ initials }}
          </div>

          <!-- 姓名与邮箱：truncate 防止长文本溢出 -->
          <div class="min-w-0">
            <div class="truncate text-base font-semibold text-surface-900 dark:text-surface-0">
              {{ name }}
            </div>
            <div class="truncate text-sm text-surface-600 dark:text-surface-300">
              {{ email }}
            </div>
          </div>
        </div>

        <!-- 角色徽章：以胶囊样式展示用户角色（如 Admin / Member） -->
        <span
          class="rounded-full bg-surface-200 px-3 py-1 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-100">
          {{ role }}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-4 p-5">
      <!-- 活跃度图表区域 -->
      <section
        class="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/40">
        <div class="mb-2">
          <div class="text-sm font-medium text-surface-900 dark:text-surface-0">Trend</div>
          <!-- 显示本次会话最后保存时间，未保存时显示占位文案 -->
          <p class="mt-1 text-xs text-surface-500 dark:text-surface-300">
            Last saved: {{ lastSavedLabel }}
          </p>
        </div>

        <!-- 加载中时显示骨架屏，加载完成后渲染 Chart.js 柱状图 -->
        <div v-if="isActivityLoading" class="h-28 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
        <Chart v-else type="bar" :data="activityChartData" :options="activityChartOptions" class="h-48" />

        <!-- 未保存草稿数量提示：0 时显示"已全部同步"，否则显示待保存数 -->
        <p class="mt-2 text-xs text-surface-500 dark:text-surface-300">
          {{
            unsavedChangesCount === 0
              ? 'Everything is synced.'
              : `${unsavedChangesCount} pending draft section(s).`
          }}
        </p>
      </section>

      <!-- 用户 ID 展示区：等宽字体展示，支持折行；点击复制到剪贴板 -->
      <section class="rounded-xl border border-surface-200 p-4 dark:border-surface-700">
        <div class="text-xs uppercase tracking-[0.12em] text-surface-500 dark:text-surface-400">
          User ID
        </div>
        <div class="mt-1 break-all font-mono text-sm text-surface-900 dark:text-surface-100">
          <!-- userId 为空时显示 '-' 占位 -->
          {{ userId || '-' }}
        </div>
        <!-- 触发父组件 copyUserId 事件，由父组件通过 Clipboard API 完成复制 -->
        <Button label="Copy ID" icon="pi pi-copy" text class="mt-2 !px-0" @click="emit('copyUserId')" />
      </section>

      <!-- 登出区域：危险色按钮，登出过程中显示加载状态并禁用点击 -->
      <div>
        <Button label="Log Out" icon="pi pi-sign-out" severity="danger" text :loading="isLoggingOut"
          :disabled="isLoggingOut" @click="emit('logout')" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 profile 领域的界面展示与交互行为（组件：ProfileSummaryCard）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import Button from 'primevue/button'
import type { ChartData, ChartOptions } from 'chart.js'

/** 摘要卡片所需的全部 Props */
interface ProfileSummaryCardProps {
  /** 显示名称（已作空值处理） */
  name: string
  /** 邮箱地址（已作空值处理） */
  email: string
  /** 用户角色（如 Admin / Member） */
  role: string
  /** 用户唯一标识符（原始字符串） */
  userId: string
  /** 头像区域的首字母缩写（最多 2 个字符） */
  initials: string
  /** 格式化后的最后保存时间标签 */
  lastSavedLabel: string
  /** 未保存草稿的数量（姓名/邮箱/密码各算 1） */
  unsavedChangesCount: number
  /** 是否正在执行登出流程 */
  isLoggingOut: boolean
  /** 活跃度图表是否处于加载中状态 */
  isActivityLoading: boolean
  /** Chart.js 堆叠柱状图的数据配置 */
  activityChartData: ChartData<'bar'>
  /** Chart.js 堆叠柱状图的选项配置 */
  activityChartOptions: ChartOptions<'bar'>
}

defineProps<ProfileSummaryCardProps>()

/** 向父组件冒泡的事件：复制用户 ID / 执行登出 */
const emit = defineEmits<{
  copyUserId: []
  logout: []
}>()
</script>
