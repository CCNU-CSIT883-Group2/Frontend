<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
    <article
      class="border-color rounded-2xl bg-surface-0 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-900 xl:col-span-2"
    >
      <header class="mb-3">
        <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">Accuracy Trend</h3>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">
          {{
            isTagView
              ? 'How your selected subject evolves across this week'
              : 'How your subjects evolve across this week'
          }}
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
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-surface-900 dark:text-surface-0">
              Correct vs Incorrect
            </h3>
            <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">
              {{
                isTagView
                  ? 'Daily tag attempt quality with stacked comparison'
                  : 'Daily subject attempt quality with stacked comparison'
              }}
            </p>
          </div>
          <Select
            v-if="isTagView && tags.length > 0"
            v-model="selectedTagModel"
            :options="tags"
            class="w-44"
            placeholder="Select tag"
            size="small"
          />
        </div>
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
          {{ isTagView ? 'Tag Accuracy Ranking' : 'Subject Accuracy Ranking' }}
        </h3>
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">
          {{ isTagView ? 'Compare current week accuracy across tags' : 'Compare current week accuracy across subjects' }}
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
        <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">
          {{ isTagView ? 'Workload split by tag' : 'Workload split by subject' }}
        </p>
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
import { computed } from 'vue'

const props = defineProps<{
  accuracyTrendChartData: ChartData<'line'>
  accuracyTrendChartOptions: ChartOptions<'line'>
  attemptsStackedChartData: ChartData<'bar'>
  attemptsStackedChartOptions: ChartOptions<'bar'>
  subjectAccuracyChartData: ChartData<'bar'>
  subjectAccuracyChartOptions: ChartOptions<'bar'>
  distributionChartData: ChartData<'doughnut', number[], string>
  distributionChartOptions: ChartOptions<'doughnut'>
  isTagView: boolean
  selectedTag: string
  tags: string[]
  insights: OverviewInsight[]
  weeklyGoalTarget: number
  weeklyGoalCompleted: number
  weeklyGoalProgress: number
  latestUpdatedLabel: string
}>()

const emit = defineEmits<{
  'update:selectedTag': [value: string]
}>()

const selectedTagModel = computed({
  get: () => props.selectedTag,
  set: (value: string) => emit('update:selectedTag', value),
})
</script>
