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
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 overview 领域的界面展示与交互行为（组件：OverviewDashboardPanel）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

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
