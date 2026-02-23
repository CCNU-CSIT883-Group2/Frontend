<template>
  <aside class="border-color rounded-2xl bg-surface-0 p-4 dark:bg-surface-900">
    <div>
      <p
        class="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-300"
      >
        Global Weekly Goal
      </p>
      <p class="mt-2 text-lg font-semibold text-surface-900 dark:text-surface-0">
        {{ weeklyGoalCompleted }} / {{ weeklyGoalTarget }} attempts
      </p>
      <div class="mt-3">
        <ProgressBar :value="weeklyGoalProgress" :show-value="false" class="h-2" />
        <p class="mt-1 text-xs font-medium text-surface-700 dark:text-surface-200">
          Progress {{ formattedWeeklyGoalProgress }}%
        </p>
      </div>
      <p class="mt-2 text-xs text-surface-500 dark:text-surface-300">
        Last updated {{ latestUpdatedLabel }}
      </p>
    </div>

    <div class="mt-5">
      <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">Smart Insights</h3>
      <ul class="mt-3 space-y-2">
        <li
          v-for="insight in insights"
          :key="insight.id"
          class="border-color rounded-xl bg-surface-50 p-3 dark:bg-surface-950"
        >
          <div class="flex items-start gap-2">
            <i :class="[insight.icon, insightToneClass(insight.tone)]" class="mt-0.5" />
            <div>
              <p class="text-sm font-medium text-surface-900 dark:text-surface-0">
                {{ insight.title }}
              </p>
              <p class="mt-1 text-xs leading-5 text-surface-500 dark:text-surface-300">
                {{ insight.description }}
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { OverviewInsight } from '@/features/overview/composables/overviewStatistics.presentation'
import { computed } from 'vue'

const props = defineProps<{
  insights: OverviewInsight[]
  weeklyGoalTarget: number
  weeklyGoalCompleted: number
  weeklyGoalProgress: number
  latestUpdatedLabel: string
}>()

const formattedWeeklyGoalProgress = computed(() => props.weeklyGoalProgress.toFixed(1))

const insightToneClass = (tone: OverviewInsight['tone']) => {
  if (tone === 'positive') {
    return 'text-green-600 dark:text-green-300'
  }

  if (tone === 'warning') {
    return 'text-orange-600 dark:text-orange-300'
  }

  return 'text-sky-600 dark:text-sky-300'
}
</script>
