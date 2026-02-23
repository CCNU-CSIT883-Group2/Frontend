/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 overview 领域的状态管理与副作用流程（模块：useOverviewStatistics）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import {
  fetchOverviewDashboardData,
  fetchOverviewSubjectDashboardData,
} from '@/features/overview/composables/overviewStatistics.api'
import {
  buildAccuracyTrendChart,
  buildAttemptsStackedChart,
  buildDistributionChart,
  buildSubjectAccuracyChart,
} from '@/features/overview/composables/overviewStatistics.charts'
import {
  buildOverviewInsights,
  buildOverviewKpiCards,
  type OverviewInsight,
  type OverviewKpiCard,
  type RankingSummary,
} from '@/features/overview/composables/overviewStatistics.presentation'
import {
  buildSubjectRankContext,
  buildSubjectRankingSummary,
  buildUniqueNonEmptyStrings,
  buildWeeklyGoalState,
  pickMostPracticedSubject,
  resolveActiveTag,
} from '@/features/overview/composables/overviewStatistics.state'
import { shareOverviewStatistics } from '@/features/overview/composables/overviewStatistics.share'
import { useOverviewRouteSync } from '@/features/overview/composables/useOverviewRouteSync'
import {
  DEFAULT_WEEKLY_ATTEMPT_GOAL,
  buildStatisticsDataFromDailyOverview,
  buildStatisticsDataFromOverview,
  buildStatisticsDataFromSubjectDetail,
  buildSubjectPerformanceFromOverview,
  buildSubjectPerformanceFromTags,
  formatDateLabel,
  formatDateTimeLabel,
  getSubjectFromQuery,
  getTagFromQuery,
  getTimeZoneFromQuery,
  getWeekStartFromQuery,
  type SubjectPerformance,
} from '@/features/overview/composables/overviewStatistics.helpers'
import { ROUTE_NAMES } from '@/router'
import type {
  DailyStatistics,
  OverviewSubjectDashboardData,
  StatisticsData,
} from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { useClipboard } from '@vueuse/core'
import { computed, ref, shallowRef, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const USE_OVERVIEW_DASHBOARD_MOCK = import.meta.env.VITE_OVERVIEW_USE_MOCK === 'true'
export type { OverviewInsight, OverviewKpiCard } from '@/features/overview/composables/overviewStatistics.presentation'

interface UseOverviewStatisticsResult {
  selectedSubject: Ref<string>
  subjects: Ref<string[]>
  selectedTag: Ref<string>
  tags: Ref<string[]>
  isTagView: ComputedRef<boolean>
  hasSubjectOptions: ComputedRef<boolean>
  isLoading: Ref<boolean>
  errorMessage: Ref<string>
  infoMessage: ComputedRef<string>
  dateRangeLabel: ComputedRef<string>
  latestUpdatedLabel: ComputedRef<string>
  kpiCards: Ref<OverviewKpiCard[]>
  insights: Ref<OverviewInsight[]>
  weeklyGoalTarget: Ref<number>
  weeklyGoalCompleted: Ref<number>
  weeklyGoalProgress: Ref<number>
  accuracyTrendChartData: Ref<ChartData<'line'>>
  accuracyTrendChartOptions: Ref<ChartOptions<'line'>>
  attemptsStackedChartData: Ref<ChartData<'bar'>>
  attemptsStackedChartOptions: Ref<ChartOptions<'bar'>>
  subjectAccuracyChartData: Ref<ChartData<'bar'>>
  subjectAccuracyChartOptions: Ref<ChartOptions<'bar'>>
  distributionChartData: Ref<ChartData<'doughnut', number[], string>>
  distributionChartOptions: Ref<ChartOptions<'doughnut'>>
  shareCurrentStatistics: () => Promise<void>
}

export function useOverviewStatistics(): UseOverviewStatisticsResult {
  const route = useRoute()
  const router = useRouter()

  const selectedSubject = ref('')
  const subjects = ref<string[]>([])
  const selectedTag = ref('')
  const tags = ref<string[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  // 用于丢弃过期请求结果，避免快速切换筛选条件时旧响应覆盖新状态。
  const latestRequestId = ref(0)
  const isInitialRefreshTriggered = ref(false)
  const isSubjectPatchedFromResponse = ref(false)
  const currentSubjectDetail = shallowRef<OverviewSubjectDashboardData | null>(null)
  const { copy: copyToClipboard, isSupported: isClipboardSupported } = useClipboard()

  const selectedStatistics = shallowRef<StatisticsData | null>(null)
  const kpiCards = shallowRef<OverviewKpiCard[]>([])
  const insights = shallowRef<OverviewInsight[]>([])
  const weeklyGoalTarget = ref(DEFAULT_WEEKLY_ATTEMPT_GOAL)
  const weeklyGoalCompleted = ref(0)
  const weeklyGoalProgress = ref(0)

  const accuracyTrendChartData = shallowRef<ChartData<'line'>>({ labels: [], datasets: [] })
  const accuracyTrendChartOptions = shallowRef<ChartOptions<'line'>>({})
  const attemptsStackedChartData = shallowRef<ChartData<'bar'>>({ labels: [], datasets: [] })
  const attemptsStackedChartOptions = shallowRef<ChartOptions<'bar'>>({})
  const subjectAccuracyChartData = shallowRef<ChartData<'bar'>>({ labels: [], datasets: [] })
  const subjectAccuracyChartOptions = shallowRef<ChartOptions<'bar'>>({})
  const distributionChartData = shallowRef<ChartData<'doughnut', number[], string>>({
    labels: [],
    datasets: [],
  })
  const distributionChartOptions = shallowRef<ChartOptions<'doughnut'>>({})

  const routeQuery = computed(() => route.query as Record<string, unknown>)
  const routeWeekStart = computed(() => getWeekStartFromQuery(routeQuery.value))
  const routeTimeZone = computed(() => getTimeZoneFromQuery(routeQuery.value))
  const isMockMode = computed(
    () => USE_OVERVIEW_DASHBOARD_MOCK || route.query.mock === '1' || route.query.mock === 'true',
  )
  const isTagView = computed(() => selectedSubject.value.length > 0)
  const hasSubjectOptions = computed(() => subjects.value.length > 0)
  const infoMessage = computed(() =>
    isMockMode.value ? 'Mock data enabled. Add `mock=0` or remove it to use live dashboard data.' : '',
  )

  const dateRangeLabel = computed(() => {
    if (!selectedStatistics.value) return 'No time range'

    return `${formatDateLabel(selectedStatistics.value.start_of_week)} - ${formatDateLabel(selectedStatistics.value.end_of_week)}`
  })

  const latestUpdatedLabel = computed(() => {
    if (!selectedStatistics.value?.latest_time) return 'No updates yet'

    return formatDateTimeLabel(selectedStatistics.value.latest_time)
  })

  const syncRouteSubject = (subject: string) => {
    const currentRouteSubject = getSubjectFromQuery(route.query)
    if (route.name === ROUTE_NAMES.overview && currentRouteSubject === subject) {
      return
    }

    const nextQuery = { ...route.query }
    if (subject) {
      nextQuery.subject = subject
    } else {
      delete nextQuery.subject
      delete nextQuery.tag
    }

    void router.replace({
      name: ROUTE_NAMES.overview,
      query: nextQuery,
    })
  }

  const syncRouteTag = (tag: string) => {
    const currentRouteTag = getTagFromQuery(route.query)
    const nextTag = selectedSubject.value && tag ? tag : ''
    if (route.name === ROUTE_NAMES.overview && currentRouteTag === nextTag) {
      return
    }

    const nextQuery = { ...route.query }
    if (nextTag) {
      nextQuery.tag = nextTag
    } else {
      delete nextQuery.tag
    }

    void router.replace({
      name: ROUTE_NAMES.overview,
      query: nextQuery,
    })
  }

  const updateAccuracyTrendChart = (subject: string, dailyStatistics: DailyStatistics[]) => {
    const chart = buildAccuracyTrendChart(subject, dailyStatistics)
    accuracyTrendChartData.value = chart.data
    accuracyTrendChartOptions.value = chart.options
  }

  const updateAttemptsStackedChart = (dailyStatistics: DailyStatistics[]) => {
    const chart = buildAttemptsStackedChart(dailyStatistics)
    attemptsStackedChartData.value = chart.data
    attemptsStackedChartOptions.value = chart.options
  }

  const updateSubjectAccuracyChart = (subjectPerformances: SubjectPerformance[]) => {
    const chart = buildSubjectAccuracyChart(subjectPerformances)
    subjectAccuracyChartData.value = chart.data
    subjectAccuracyChartOptions.value = chart.options
  }

  const updateDistributionChart = (subjectPerformances: SubjectPerformance[]) => {
    const chart = buildDistributionChart(subjectPerformances)
    distributionChartData.value = chart.data
    distributionChartOptions.value = chart.options
  }

  const updateKpiCards = (
    selectedSubjectValue: string,
    subjectPerformances: SubjectPerformance[],
    summary?: RankingSummary,
    options?: {
      rankLabel?: string
      rankUnitLabel?: string
      rankValue?: string
      rankHelper?: string
      rankTone?: OverviewKpiCard['tone']
    },
  ) => {
    kpiCards.value = buildOverviewKpiCards({
      selectedSubject: selectedSubjectValue,
      subjectPerformances,
      selectedStatistics: selectedStatistics.value,
      summary,
      options,
    })
  }

  const updateInsights = (selectedSubjectValue: string, subjectPerformances: SubjectPerformance[]) => {
    insights.value = buildOverviewInsights({
      selectedSubjectLabel: selectedSubjectValue,
      selectedStatistics: selectedStatistics.value,
      subjectPerformances,
    })
  }

  const refreshCharts = async () => {
    const requestId = ++latestRequestId.value
    isLoading.value = true
    errorMessage.value = ''

    try {
      const overviewData = await fetchOverviewDashboardData({
        isMockMode: isMockMode.value,
        subjects: subjects.value,
        routeQuery: routeQuery.value,
      })

      if (requestId !== latestRequestId.value) {
        return
      }

      const weeklyGoalState = buildWeeklyGoalState(overviewData.summary)
      weeklyGoalTarget.value = weeklyGoalState.target
      weeklyGoalCompleted.value = weeklyGoalState.completed
      weeklyGoalProgress.value = weeklyGoalState.progress

      const nextSubjects = buildUniqueNonEmptyStrings(
        overviewData.subject_overview.map((entry) => entry.subject),
      )
      subjects.value = nextSubjects
      const subjectPerformances = buildSubjectPerformanceFromOverview(nextSubjects, overviewData.subject_overview)
      const { selectedSubjectRank, activeSubjectCount } = buildSubjectRankContext(
        subjectPerformances,
        selectedSubject.value,
      )

      const hasActiveSubject =
        selectedSubject.value.length > 0 && nextSubjects.includes(selectedSubject.value)

      if (selectedSubject.value && !hasActiveSubject) {
        isSubjectPatchedFromResponse.value = true
        selectedSubject.value = ''
      }

      if (!hasActiveSubject) {
        // “全科视图”：不进入 subject 细分接口，直接展示聚合统计。
        currentSubjectDetail.value = null
        tags.value = []
        selectedTag.value = ''
        selectedStatistics.value = buildStatisticsDataFromOverview(overviewData)
        const focusSubject = overviewData.focus_subject || subjectPerformances[0]?.subject || 'All Subjects'
        const mostPracticedSubject = pickMostPracticedSubject(subjectPerformances)

        updateAccuracyTrendChart('All Subjects', selectedStatistics.value.daily_statistics)
        updateAttemptsStackedChart(selectedStatistics.value.daily_statistics)
        updateSubjectAccuracyChart(subjectPerformances)
        updateDistributionChart(subjectPerformances)
        updateKpiCards(focusSubject, subjectPerformances, overviewData.summary, {
          rankLabel: 'Most Practiced Subject',
          rankValue: mostPracticedSubject?.subject ?? '--',
          rankHelper: mostPracticedSubject
            ? `${mostPracticedSubject.totalAttempts} attempts this week`
            : 'No attempts this week',
          rankTone: mostPracticedSubject && mostPracticedSubject.totalAttempts > 0 ? 'positive' : 'neutral',
        })
        updateInsights('all subjects', subjectPerformances)
        return
      }

      const subjectDetail = await fetchOverviewSubjectDashboardData({
        isMockMode: isMockMode.value,
        subject: selectedSubject.value,
        subjects: subjects.value,
        routeQuery: routeQuery.value,
      })

      if (requestId !== latestRequestId.value) {
        return
      }

      // “单科视图”：根据 query/focus/fallback 计算有效 tag，避免 URL 与数据不一致。
      const tagPerformances = buildSubjectPerformanceFromTags(subjectDetail.tag_overview)
      const fallbackTag = pickMostPracticedSubject(tagPerformances)
      const nextTags = buildUniqueNonEmptyStrings(subjectDetail.tag_overview.map((entry) => entry.tag))
      const queryTag = getTagFromQuery(routeQuery.value)
      const activeTag = resolveActiveTag({
        selectedTag: selectedTag.value,
        queryTag,
        focusTag: subjectDetail.focus_tag,
        fallbackTag: fallbackTag?.subject ?? '',
        availableTags: nextTags,
      })

      currentSubjectDetail.value = subjectDetail
      tags.value = nextTags
      if (selectedTag.value !== activeTag) {
        selectedTag.value = activeTag
      }
      const subjectDailyStatistics = buildStatisticsDataFromDailyOverview(
        subjectDetail.latest_time,
        subjectDetail.start_of_week,
        subjectDetail.end_of_week,
        subjectDetail.daily_overview,
      ).daily_statistics

      selectedStatistics.value = buildStatisticsDataFromSubjectDetail(subjectDetail, activeTag)

      const activeSeriesLabel = activeTag || selectedSubject.value

      updateAccuracyTrendChart(selectedSubject.value, subjectDailyStatistics)
      updateAttemptsStackedChart(selectedStatistics.value.daily_statistics)
      updateSubjectAccuracyChart(tagPerformances)
      updateDistributionChart(tagPerformances)
      updateKpiCards(
        selectedSubject.value,
        subjectPerformances,
        buildSubjectRankingSummary({
          subjectDetail,
          selectedSubjectRank,
          activeSubjectCount,
          overviewSummary: overviewData.summary,
        }),
        {
          rankLabel: 'Subject Ranking',
          rankUnitLabel: 'subjects',
        },
      )
      updateInsights(activeSeriesLabel, tagPerformances)
    } catch {
      if (requestId !== latestRequestId.value) {
        return
      }

      errorMessage.value = 'Failed to load dashboard overview. Please try again later.'
    } finally {
      if (requestId === latestRequestId.value) {
        isLoading.value = false
      }
    }
  }

  const shareCurrentStatistics = async () => {
    errorMessage.value = ''
    const nextErrorMessage = await shareOverviewStatistics({
      subject: selectedSubject.value,
      isClipboardSupported: isClipboardSupported.value,
      copyToClipboard,
    })
    if (nextErrorMessage) {
      errorMessage.value = nextErrorMessage
    }
  }

  useOverviewRouteSync({
    routeQuery,
    selectedSubject,
    selectedTag,
    isTagView,
    isSubjectPatchedFromResponse,
    isInitialRefreshTriggered,
    routeWeekStart,
    routeTimeZone,
    syncRouteSubject,
    syncRouteTag,
    getSubjectFromQuery,
    getTagFromQuery,
    refreshCharts,
    onTagChanged: (tag) => {
      if (!currentSubjectDetail.value) {
        return
      }

      const tagDailyStatistics = buildStatisticsDataFromSubjectDetail(currentSubjectDetail.value, tag)
      updateAttemptsStackedChart(tagDailyStatistics.daily_statistics)
    },
  })

  return {
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
  }
}
