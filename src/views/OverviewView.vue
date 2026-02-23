<template>
  <div ref="pageRef" class="m-3 w-full flex-1">
    <div
      :class="[
        'fixed left-0 right-0 top-14 z-20 border-b border-surface-200 bg-surface-0/95 backdrop-blur-sm transition-shadow duration-200 dark:border-surface-700 dark:bg-surface-950/95',
        hasScrolled
          ? 'shadow-[0_10px_16px_-14px_rgba(15,23,42,0.55)] dark:shadow-[0_10px_16px_-14px_rgba(2,6,23,0.9)]'
          : '',
      ]"
    >
      <div class="mx-3 px-1 py-2">
        <OverviewToolbar
          v-model="selectedSubject"
          :subjects="subjects"
          :date-range-label="dateRangeLabel"
          @share="shareCurrentStatistics"
        />
      </div>
    </div>

    <section class="flex w-full flex-col gap-4 pt-24 pb-3 lg:pt-24 lg:pb-3">
      <Message v-if="!isLoading && errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <Message v-else-if="!isLoading && !hasSubjectOptions" severity="info" :closable="false">
        No subjects found. Start a quiz first to generate statistics.
      </Message>

      <Message v-else-if="!isLoading && infoMessage" severity="info" :closable="false">
        {{ infoMessage }}
      </Message>

      <div v-if="isLoading" class="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Skeleton height="7rem" />
        <Skeleton height="7rem" />
        <Skeleton height="7rem" />
        <Skeleton height="7rem" />
        <Skeleton height="24rem" class="xl:col-span-2" />
        <Skeleton height="19rem" />
      </div>

      <OverviewDashboardPanel
        v-else-if="hasSubjectOptions"
        :kpi-cards="kpiCards"
        :insights="insights"
        :is-tag-view="isTagView"
        :selected-tag="selectedTag"
        :tags="tags"
        :weekly-goal-target="weeklyGoalTarget"
        :weekly-goal-completed="weeklyGoalCompleted"
        :weekly-goal-progress="weeklyGoalProgress"
        :latest-updated-label="latestUpdatedLabel"
        :accuracy-trend-chart-data="accuracyTrendChartData"
        :accuracy-trend-chart-options="accuracyTrendChartOptions"
        :attempts-stacked-chart-data="attemptsStackedChartData"
        :attempts-stacked-chart-options="attemptsStackedChartOptions"
        :subject-accuracy-chart-data="subjectAccuracyChartData"
        :subject-accuracy-chart-options="subjectAccuracyChartOptions"
        :distribution-chart-data="distributionChartData"
        :distribution-chart-options="distributionChartOptions"
        @update:selected-tag="handleTagChange"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import OverviewDashboardPanel from '@/features/overview/components/OverviewDashboardPanel.vue'
import OverviewToolbar from '@/features/overview/components/OverviewToolbar.vue'
import { useOverviewStatistics } from '@/features/overview/composables/useOverviewStatistics'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const {
  selectedSubject,
  subjects,
  selectedTag,
  tags,
  isTagView,
  hasSubjectOptions,
  isLoading,
  errorMessage,
  infoMessage,
  dateRangeLabel,
  latestUpdatedLabel,
  kpiCards,
  insights,
  weeklyGoalTarget,
  weeklyGoalCompleted,
  weeklyGoalProgress,
  accuracyTrendChartData,
  accuracyTrendChartOptions,
  attemptsStackedChartData,
  attemptsStackedChartOptions,
  subjectAccuracyChartData,
  subjectAccuracyChartOptions,
  distributionChartData,
  distributionChartOptions,
  shareCurrentStatistics,
} = useOverviewStatistics()

const handleTagChange = (nextTag: string) => {
  selectedTag.value = nextTag
}

const pageRef = ref<HTMLElement | null>(null)
const hasScrolled = ref(false)

let scrollContainer: HTMLElement | null = null

const isScrollableElement = (element: HTMLElement) => {
  const { overflowY } = window.getComputedStyle(element)
  return /(auto|scroll|overlay)/.test(overflowY)
}

const resolveScrollContainer = (start: HTMLElement | null) => {
  let current = start?.parentElement ?? null

  while (current) {
    if (isScrollableElement(current)) {
      return current
    }
    current = current.parentElement
  }

  return null
}

const updateToolbarShadow = () => {
  if (scrollContainer) {
    hasScrolled.value = scrollContainer.scrollTop > 0
    return
  }

  hasScrolled.value = window.scrollY > 0
}

onMounted(() => {
  scrollContainer = resolveScrollContainer(pageRef.value)

  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', updateToolbarShadow, { passive: true })
  } else {
    window.addEventListener('scroll', updateToolbarShadow, { passive: true })
  }

  updateToolbarShadow()
})

onBeforeUnmount(() => {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', updateToolbarShadow)
    return
  }

  window.removeEventListener('scroll', updateToolbarShadow)
})
</script>
