<template>
  <div class="flex flex-col gap-4">
    <OverviewKpiGrid :cards="kpiCards" />

    <OverviewChartsPanel
      :accuracy-trend-chart-data="accuracyTrendChartData"
      :accuracy-trend-chart-options="accuracyTrendChartOptions"
      :attempts-stacked-chart-data="attemptsStackedChartData"
      :attempts-stacked-chart-options="attemptsStackedChartOptions"
      :subject-accuracy-chart-data="subjectAccuracyChartData"
      :subject-accuracy-chart-options="subjectAccuracyChartOptions"
      :distribution-chart-data="distributionChartData"
      :distribution-chart-options="distributionChartOptions"
      :insights="insights"
      :weekly-goal-target="weeklyGoalTarget"
      :weekly-goal-completed="weeklyGoalCompleted"
      :weekly-goal-progress="weeklyGoalProgress"
      :latest-updated-label="latestUpdatedLabel"
    />
  </div>
</template>

<script setup lang="ts">
import OverviewChartsPanel from '@/features/overview/components/OverviewChartsPanel.vue'
import OverviewKpiGrid from '@/features/overview/components/OverviewKpiGrid.vue'
import type { ChartData, ChartOptions } from 'chart.js'
import type {
  OverviewInsight,
  OverviewKpiCard,
} from '@/features/overview/composables/useOverviewStatistics'

defineProps<{
  kpiCards: OverviewKpiCard[]
  insights: OverviewInsight[]
  weeklyGoalTarget: number
  weeklyGoalCompleted: number
  weeklyGoalProgress: number
  latestUpdatedLabel: string
  accuracyTrendChartData: ChartData<'line'>
  accuracyTrendChartOptions: ChartOptions<'line'>
  attemptsStackedChartData: ChartData<'bar'>
  attemptsStackedChartOptions: ChartOptions<'bar'>
  subjectAccuracyChartData: ChartData<'bar'>
  subjectAccuracyChartOptions: ChartOptions<'bar'>
  distributionChartData: ChartData<'doughnut', number[], string>
  distributionChartOptions: ChartOptions<'doughnut'>
}>()
</script>
