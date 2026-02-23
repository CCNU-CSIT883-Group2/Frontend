<template>
  <aside
    class="overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 shadow-sm dark:border-surface-700 dark:bg-surface-900">
    <div
      class="bg-gradient-to-br from-surface-100 via-surface-50 to-surface-0 px-5 py-6 dark:from-surface-800 dark:via-surface-900 dark:to-surface-900">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-900 text-lg font-semibold text-surface-0 dark:bg-surface-0 dark:text-surface-900">
            {{ initials }}
          </div>

          <div class="min-w-0">
            <div class="truncate text-base font-semibold text-surface-900 dark:text-surface-0">
              {{ name }}
            </div>
            <div class="truncate text-sm text-surface-600 dark:text-surface-300">
              {{ email }}
            </div>
          </div>
        </div>

        <span
          class="rounded-full bg-surface-200 px-3 py-1 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-100">
          {{ role }}
        </span>
      </div>
    </div>

    <div class="flex flex-col gap-4 p-5">
      <section
        class="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/40">
        <div class="mb-2">
          <div class="text-sm font-medium text-surface-900 dark:text-surface-0">Trend</div>
          <p class="mt-1 text-xs text-surface-500 dark:text-surface-300">
            Last saved: {{ lastSavedLabel }}
          </p>
        </div>

        <div v-if="isActivityLoading" class="h-28 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
        <Chart v-else type="bar" :data="activityChartData" :options="activityChartOptions" class="h-48" />

        <p class="mt-2 text-xs text-surface-500 dark:text-surface-300">
          {{
            unsavedChangesCount === 0
              ? 'Everything is synced.'
              : `${unsavedChangesCount} pending draft section(s).`
          }}
        </p>
      </section>

      <section class="rounded-xl border border-surface-200 p-4 dark:border-surface-700">
        <div class="text-xs uppercase tracking-[0.12em] text-surface-500 dark:text-surface-400">
          User ID
        </div>
        <div class="mt-1 break-all font-mono text-sm text-surface-900 dark:text-surface-100">
          {{ userId || '-' }}
        </div>
        <Button label="Copy ID" icon="pi pi-copy" text class="mt-2 !px-0" @click="emit('copyUserId')" />
      </section>

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

interface ProfileSummaryCardProps {
  name: string
  email: string
  role: string
  userId: string
  initials: string
  lastSavedLabel: string
  unsavedChangesCount: number
  isLoggingOut: boolean
  isActivityLoading: boolean
  activityChartData: ChartData<'bar'>
  activityChartOptions: ChartOptions<'bar'>
}

defineProps<ProfileSummaryCardProps>()

const emit = defineEmits<{
  copyUserId: []
  logout: []
}>()
</script>
