<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
    <article
      class="border-color rounded-2xl bg-surface-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-900 xl:col-span-2"
    >
      <header class="mb-3">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">Accuracy Trend</h3>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">
          How your selected subject evolves across this week
        </p>
      </header>
      <Chart
        type="line"
        :data="accuracyTrendChartData"
        :options="accuracyTrendChartOptions"
        class="h-80"
      />
    </article>

    <div class="h-full">
      <OverviewInsightsPanel
        class="h-full"
        :insights="insights"
        :weekly-goal-target="weeklyGoalTarget"
        :weekly-goal-completed="weeklyGoalCompleted"
        :weekly-goal-progress="weeklyGoalProgress"
        :latest-updated-label="latestUpdatedLabel"
      />
    </div>

    <article
      class="border-color rounded-2xl bg-surface-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-900"
    >
      <header class="mb-3">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">
          Correct vs Incorrect
        </h3>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">
          Daily attempt quality with stacked comparison
        </p>
      </header>
      <Chart
        type="bar"
        :data="attemptsStackedChartData"
        :options="attemptsStackedChartOptions"
        class="h-72"
      />
    </article>

    <article
      class="border-color rounded-2xl bg-surface-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-900"
    >
      <header class="mb-3">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">
          Subject Accuracy Ranking
        </h3>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">
          Compare current week accuracy across subjects
        </p>
      </header>
      <Chart
        type="bar"
        :data="subjectAccuracyChartData"
        :options="subjectAccuracyChartOptions"
        class="h-72"
      />
    </article>

    <article
      class="border-color rounded-2xl bg-surface-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-900"
    >
      <header class="mb-3">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">
          Attempt Distribution
        </h3>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">Workload split by subject</p>
      </header>
      <Chart
        type="doughnut"
        :data="distributionChartData"
        :options="distributionChartOptions"
        class="h-72"
      />
    </article>
  </div>
</template>

<script setup lang="ts">
import OverviewInsightsPanel from '@/features/overview/components/OverviewInsightsPanel.vue'
import type { OverviewInsight } from '@/features/overview/composables/useOverviewStatistics'
import type { ChartData, ChartOptions } from 'chart.js'

defineProps<{
  accuracyTrendChartData: ChartData<'line'>
  accuracyTrendChartOptions: ChartOptions<'line'>
  attemptsStackedChartData: ChartData<'bar'>
  attemptsStackedChartOptions: ChartOptions<'bar'>
  subjectAccuracyChartData: ChartData<'bar'>
  subjectAccuracyChartOptions: ChartOptions<'bar'>
  distributionChartData: ChartData<'doughnut', number[], string>
  distributionChartOptions: ChartOptions<'doughnut'>
  insights: OverviewInsight[]
  weeklyGoalTarget: number
  weeklyGoalCompleted: number
  weeklyGoalProgress: number
  latestUpdatedLabel: string
}>()
</script>
