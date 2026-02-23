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

// 重新导出展示层类型，方便消费方从统一入口引入
export type { OverviewInsight, OverviewKpiCard } from '@/features/overview/composables/overviewStatistics.presentation'

/** useOverviewStatistics 的返回值类型，明确声明每个字段的响应性包装类型 */
interface UseOverviewStatisticsResult {
  selectedSubject: Ref<string>
  subjects: Ref<string[]>
  selectedTag: Ref<string>
  tags: Ref<string[]>
  isTagView: ComputedRef<boolean>
  hasSubjectOptions: ComputedRef<boolean>
  isLoading: Ref<boolean>
  errorMessage: Ref<string>
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

/**
 * 概览统计页核心 composable。
 *
 * 职责：
 * 1. 管理学科/标签筛选状态，并与 URL query 双向同步；
 * 2. 按需请求后端统计接口；
 * 3. 将后端数据转换为图表配置、KPI 卡片和 insights；
 * 4. 提供分享当前统计页面的功能。
 */
export function useOverviewStatistics(): UseOverviewStatisticsResult {
  const route = useRoute()
  const router = useRouter()

  /** 当前选中学科（空字符串表示"全科"视图） */
  const selectedSubject = ref('')
  /** 后端返回的所有学科列表 */
  const subjects = ref<string[]>([])
  /** 当前选中标签（仅在"单科"视图下有效） */
  const selectedTag = ref('')
  /** 当前学科下的所有可用标签 */
  const tags = ref<string[]>([])
  /** 是否正在加载数据 */
  const isLoading = ref(false)
  /** 数据加载失败时的错误信息 */
  const errorMessage = ref('')

  // 用于丢弃过期请求结果，避免快速切换筛选条件时旧响应覆盖新状态。
  const latestRequestId = ref(0)
  /** 是否已触发过初始刷新（用于避免时区/周起始变化时重复触发） */
  const isInitialRefreshTriggered = ref(false)
  /** 标记 subject 是由响应自动修正（而非用户选择），用于跳过不必要的路由同步 */
  const isSubjectPatchedFromResponse = ref(false)
  /** 缓存上次获取的学科细分数据，用于标签切换时免重复请求 */
  const currentSubjectDetail = shallowRef<OverviewSubjectDashboardData | null>(null)
  const { copy: copyToClipboard, isSupported: isClipboardSupported } = useClipboard()

  /** 当前展示的统计时间序列数据（图表和 KPI 的数据源） */
  const selectedStatistics = shallowRef<StatisticsData | null>(null)
  /** KPI 卡片数组（正确率、作答数、活跃天数、排名等） */
  const kpiCards = shallowRef<OverviewKpiCard[]>([])
  /** 洞察建议列表 */
  const insights = shallowRef<OverviewInsight[]>([])
  const weeklyGoalTarget = ref(DEFAULT_WEEKLY_ATTEMPT_GOAL)
  const weeklyGoalCompleted = ref(0)
  const weeklyGoalProgress = ref(0)

  // 图表配置：各图表的 data 和 options 单独存储，避免深层响应性开销
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

  /** 当前路由查询参数（类型转换为 Record<string, unknown> 便于辅助函数使用） */
  const routeQuery = computed(() => route.query as Record<string, unknown>)
  /** 当前 URL 中的 week_start 参数 */
  const routeWeekStart = computed(() => getWeekStartFromQuery(routeQuery.value))
  /** 当前 URL 中的 tz（时区）参数 */
  const routeTimeZone = computed(() => getTimeZoneFromQuery(routeQuery.value))
  /** 是否处于单科视图（有 selectedSubject 时为 true） */
  const isTagView = computed(() => selectedSubject.value.length > 0)
  /** 是否有可供筛选的学科选项 */
  const hasSubjectOptions = computed(() => subjects.value.length > 0)

  /** 格式化为"月 日 - 月 日"的日期范围标签，用于工具栏显示 */
  const dateRangeLabel = computed(() => {
    if (!selectedStatistics.value) return 'No time range'

    return `${formatDateLabel(selectedStatistics.value.start_of_week)} - ${formatDateLabel(selectedStatistics.value.end_of_week)}`
  })

  /** 格式化为"月 日 时:分"的最后更新时间标签 */
  const latestUpdatedLabel = computed(() => {
    if (!selectedStatistics.value?.latest_time) return 'No updates yet'

    return formatDateTimeLabel(selectedStatistics.value.latest_time)
  })

  /**
   * 将当前 selectedSubject 同步回 URL query（subject 参数）。
   * 若与当前 URL 相同则跳过，避免不必要的路由替换。
   * 清空学科时同时删除 tag 参数。
   */
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

  /**
   * 将当前 selectedTag 同步回 URL query（tag 参数）。
   * 只有在单科视图（hasSubject）且 tag 非空时才写入 query。
   */
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

  // 以下四个函数将纯构建逻辑的返回值写入对应的 shallowRef，触发图表重新渲染

  /** 更新正确率趋势折线图 */
  const updateAccuracyTrendChart = (subject: string, dailyStatistics: DailyStatistics[]) => {
    const chart = buildAccuracyTrendChart(subject, dailyStatistics)
    accuracyTrendChartData.value = chart.data
    accuracyTrendChartOptions.value = chart.options
  }

  /** 更新每日作答量堆叠柱状图 */
  const updateAttemptsStackedChart = (dailyStatistics: DailyStatistics[]) => {
    const chart = buildAttemptsStackedChart(dailyStatistics)
    attemptsStackedChartData.value = chart.data
    attemptsStackedChartOptions.value = chart.options
  }

  /** 更新学科/标签正确率横向柱状图 */
  const updateSubjectAccuracyChart = (subjectPerformances: SubjectPerformance[]) => {
    const chart = buildSubjectAccuracyChart(subjectPerformances)
    subjectAccuracyChartData.value = chart.data
    subjectAccuracyChartOptions.value = chart.options
  }

  /** 更新作答量分布甜甜圈图 */
  const updateDistributionChart = (subjectPerformances: SubjectPerformance[]) => {
    const chart = buildDistributionChart(subjectPerformances)
    distributionChartData.value = chart.data
    distributionChartOptions.value = chart.options
  }

  /** 根据最新数据重新计算并更新 KPI 卡片 */
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

  /** 根据最新数据重新生成 insights 建议列表 */
  const updateInsights = (selectedSubjectValue: string, subjectPerformances: SubjectPerformance[]) => {
    insights.value = buildOverviewInsights({
      selectedSubjectLabel: selectedSubjectValue,
      selectedStatistics: selectedStatistics.value,
      subjectPerformances,
    })
  }

  /**
   * 核心数据刷新函数：
   * 1. 递增 requestId 以标记本次请求，过期响应通过 requestId 对比被丢弃；
   * 2. 获取全局概览数据（overviewData）；
   * 3. 若无有效 selectedSubject，展示"全科视图"并返回；
   * 4. 若有 selectedSubject，再发起学科细分请求，展示"单科视图"。
   */
  const refreshCharts = async () => {
    const requestId = ++latestRequestId.value
    isLoading.value = true
    errorMessage.value = ''

    try {
      const overviewData = await fetchOverviewDashboardData({
        routeQuery: routeQuery.value,
      })

      // 响应过期（用户已切换到更新的请求），丢弃此次结果
      if (requestId !== latestRequestId.value) {
        return
      }

      // 解析周目标进度
      const weeklyGoalState = buildWeeklyGoalState(overviewData.summary)
      weeklyGoalTarget.value = weeklyGoalState.target
      weeklyGoalCompleted.value = weeklyGoalState.completed
      weeklyGoalProgress.value = weeklyGoalState.progress

      // 提取并更新学科列表
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

      // 若 selectedSubject 已不在后端返回的学科列表中（如被删除），自动清空
      if (selectedSubject.value && !hasActiveSubject) {
        isSubjectPatchedFromResponse.value = true
        selectedSubject.value = ''
      }

      if (!hasActiveSubject) {
        // "全科视图"：不进入 subject 细分接口，直接展示聚合统计。
        currentSubjectDetail.value = null
        tags.value = []
        selectedTag.value = ''
        selectedStatistics.value = buildStatisticsDataFromOverview(overviewData)
        const focusSubject = overviewData.focus_subject || subjectPerformances[0]?.subject || 'All Subjects'
        const mostPracticedSubject = pickMostPracticedSubject(subjectPerformances)

        // 全科视图：正确率趋势图使用聚合每日数据
        updateAccuracyTrendChart('All Subjects', selectedStatistics.value.daily_statistics)
        updateAttemptsStackedChart(selectedStatistics.value.daily_statistics)
        // 学科准确率图和分布图展示各学科对比
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

      // "单科视图"：进一步请求学科细分数据
      const subjectDetail = await fetchOverviewSubjectDashboardData({
        subject: selectedSubject.value,
        routeQuery: routeQuery.value,
      })

      if (requestId !== latestRequestId.value) {
        return
      }

      // "单科视图"：根据 query/focus/fallback 计算有效 tag，避免 URL 与数据不一致。
      const tagPerformances = buildSubjectPerformanceFromTags(subjectDetail.tag_overview)
      const fallbackTag = pickMostPracticedSubject(tagPerformances)
      const nextTags = buildUniqueNonEmptyStrings(subjectDetail.tag_overview.map((entry) => entry.tag))
      const queryTag = getTagFromQuery(routeQuery.value)
      // 按优先级解析有效标签：用户选择 > URL 参数 > 后端 focus_tag > 最活跃标签
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
      // 单科整体每日数据（不区分 tag，用于趋势折线图）
      const subjectDailyStatistics = buildStatisticsDataFromDailyOverview(
        subjectDetail.latest_time,
        subjectDetail.start_of_week,
        subjectDetail.end_of_week,
        subjectDetail.daily_overview,
      ).daily_statistics

      // 若有 activeTag，selectedStatistics 按 tag 过滤；否则使用整体数据
      selectedStatistics.value = buildStatisticsDataFromSubjectDetail(subjectDetail, activeTag)

      const activeSeriesLabel = activeTag || selectedSubject.value

      // 趋势折线图使用整体学科数据（不受 tag 影响）
      updateAccuracyTrendChart(selectedSubject.value, subjectDailyStatistics)
      // 堆叠柱状图使用 tag 过滤后的数据
      updateAttemptsStackedChart(selectedStatistics.value.daily_statistics)
      // 学科准确率图和分布图展示各标签对比
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
      // 过期请求的错误不展示
      if (requestId !== latestRequestId.value) {
        return
      }

      errorMessage.value = 'Failed to load dashboard overview. Please try again later.'
    } finally {
      // 仅最新请求才清除 loading 状态
      if (requestId === latestRequestId.value) {
        isLoading.value = false
      }
    }
  }

  /**
   * 分享当前统计页面（调用 share 层函数，错误由此函数展示）。
   * 未选择学科时不执行任何操作。
   */
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

  // 注册路由/状态双向同步逻辑（URL <-> selectedSubject/selectedTag）
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
    // 标签切换时（不重新请求后端）本地重算堆叠图数据
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
