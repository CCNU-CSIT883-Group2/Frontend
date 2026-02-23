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
      :is-tag-view="isTagView"
      :selected-tag="selectedTag"
      :tags="tags"
      :insights="insights"
      :weekly-goal-target="weeklyGoalTarget"
      :weekly-goal-completed="weeklyGoalCompleted"
      :weekly-goal-progress="weeklyGoalProgress"
      :latest-updated-label="latestUpdatedLabel"
      @update:selected-tag="emit('update:selectedTag', $event)"
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
} from '@/features/overview/composables/overviewStatistics.presentation'

defineProps<{
  kpiCards: OverviewKpiCard[]
  insights: OverviewInsight[]
  isTagView: boolean
  selectedTag: string
  tags: string[]
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

const emit = defineEmits<{
  'update:selectedTag': [value: string]
}>()
</script>
