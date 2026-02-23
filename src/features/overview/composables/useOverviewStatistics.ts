import axios from '@/axios'
import {
  buildOverviewDashboardMockData,
  buildOverviewSubjectDashboardMockData,
} from '@/features/overview/mocks/overviewDashboardMock'
import { ROUTE_NAMES } from '@/router'
import type {
  DailyStatistics,
  OverviewDashboardData,
  OverviewSubjectDashboardData,
  OverviewTagData,
  Response,
  StatisticsData,
} from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { useClipboard, watchIgnorable } from '@vueuse/core'
import { computed, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const CHART_SERIES_COLORS = ['#60A5FA', '#22D3EE', '#34D399', '#FBBF24', '#FB923C', '#A78BFA'] as const
const CHART_SERIES_HOVER_COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#8B5CF6'] as const
const TREND_LINE_COLOR = '#3B82F6'
const TREND_FILL_COLOR = 'rgba(59, 130, 246, 0.16)'
const CORRECT_BAR_COLOR = '#10B981'
const INCORRECT_BAR_COLOR = '#F59E0B'
const DEFAULT_WEEKLY_ATTEMPT_GOAL = 120
const USE_OVERVIEW_DASHBOARD_MOCK = import.meta.env.VITE_OVERVIEW_USE_MOCK === 'true'

interface SubjectPerformance {
  subject: string
  totalAttempts: number
  correctAttempts: number
  accuracyRate: number
}

interface RankingSummary {
  total_attempts: number
  correct_attempts: number
  accuracy_rate: number
  weekly_goal: number
  weekly_goal_progress: number
  subject_rank?: number
  active_subject_count?: number
  tag_rank?: number
  tag_count?: number
}

export interface OverviewKpiCard {
  id: string
  label: string
  value: string
  helper: string
  icon: string
  tone: 'positive' | 'neutral' | 'warning'
}

export interface OverviewInsight {
  id: string
  title: string
  description: string
  icon: string
  tone: 'positive' | 'neutral' | 'warning'
}

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

const getSubjectFromQuery = (query: Record<string, unknown>) =>
  typeof query.subject === 'string' ? query.subject : ''

const getWeekStartFromQuery = (query: Record<string, unknown>) =>
  typeof query.week_start === 'string' ? query.week_start : ''

const getTimeZoneFromQuery = (query: Record<string, unknown>) =>
  typeof query.tz === 'string' ? query.tz : ''

const getTagFromQuery = (query: Record<string, unknown>) =>
  typeof query.tag === 'string' ? query.tag : ''

const parseDate = (value: string) => {
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? null : date
}

const formatDayLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

const formatDateLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const formatDateTimeLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatRate = (value: number, digits = 1) => `${value.toFixed(digits)}%`

const normalizeRate = (rate: number) => (rate > 1 ? rate / 100 : rate)

const normalizeProgressPercent = (progress: number) => (progress <= 1 ? progress * 100 : progress)

const calculateConsecutiveActiveDays = (dailyStatistics: DailyStatistics[]) => {
  let streak = 0

  for (let index = dailyStatistics.length - 1; index >= 0; index -= 1) {
    if (dailyStatistics[index].total_attempts > 0) {
      streak += 1
      continue
    }

    if (streak > 0) {
      break
    }
  }

  return streak
}

const buildStatisticsDataFromDailyOverview = (
  latestTime: string,
  startOfWeek: string,
  endOfWeek: string,
  dailyOverview: Array<{
    date: string
    total_attempts: number
    correct_attempts: number
    accuracy_rate: number
  }>,
): StatisticsData => ({
  latest_time: latestTime,
  start_of_week: startOfWeek,
  end_of_week: endOfWeek,
  daily_statistics: dailyOverview.map((entry) => ({
    date: entry.date,
    total_attempts: entry.total_attempts,
    correct_attempts: entry.correct_attempts,
    correct_rate: normalizeRate(entry.accuracy_rate),
    questions_on_date: [],
  })),
})

const buildStatisticsDataFromOverview = (overview: OverviewDashboardData): StatisticsData =>
  buildStatisticsDataFromDailyOverview(
    overview.latest_time,
    overview.start_of_week,
    overview.end_of_week,
    overview.daily_overview,
  )

const buildSubjectPerformanceFromOverview = (
  subjects: string[],
  subjectOverview: OverviewDashboardData['subject_overview'],
): SubjectPerformance[] => {
  const performanceMap = new Map(
    subjectOverview.map((entry) => [
      entry.subject,
      {
        subject: entry.subject,
        totalAttempts: entry.total_attempts,
        correctAttempts: entry.correct_attempts,
        accuracyRate: normalizeRate(entry.accuracy_rate) * 100,
      },
    ]),
  )

  return subjects.map((subject) => {
    const performance = performanceMap.get(subject)
    if (performance) {
      return performance
    }

    return {
      subject,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracyRate: 0,
    }
  })
}

const buildStatisticsDataFromSubjectDetail = (
  subjectDetail: OverviewSubjectDashboardData,
  focusTag: string,
): StatisticsData => {
  const hasTagDaily = subjectDetail.daily_tag_overview.length > 0 && focusTag.length > 0

  if (!hasTagDaily) {
    return buildStatisticsDataFromDailyOverview(
      subjectDetail.latest_time,
      subjectDetail.start_of_week,
      subjectDetail.end_of_week,
      subjectDetail.daily_overview,
    )
  }

  const dailyOverview = subjectDetail.daily_tag_overview.map((day) => {
    const selectedTag = day.tags.find((tag) => tag.tag === focusTag)
    const totalAttempts = selectedTag?.total_attempts ?? 0
    const correctAttempts = selectedTag?.correct_attempts ?? 0

    return {
      date: day.date,
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      accuracy_rate:
        typeof selectedTag?.accuracy_rate === 'number'
          ? selectedTag.accuracy_rate
          : totalAttempts > 0
            ? correctAttempts / totalAttempts
            : 0,
    }
  })

  return buildStatisticsDataFromDailyOverview(
    subjectDetail.latest_time,
    subjectDetail.start_of_week,
    subjectDetail.end_of_week,
    dailyOverview,
  )
}

const buildSubjectPerformanceFromTags = (tagOverview: OverviewTagData[]): SubjectPerformance[] =>
  tagOverview.map((entry) => ({
    subject: entry.tag,
    totalAttempts: entry.total_attempts,
    correctAttempts: entry.correct_attempts,
    accuracyRate: normalizeRate(entry.accuracy_rate) * 100,
  }))

const buildRequestParams = (
  routeQuery: Record<string, unknown>,
  selectedSubject?: string,
  selectedTag?: string,
): Record<string, string> => {
  const queryWeekStart = typeof routeQuery.week_start === 'string' ? routeQuery.week_start : undefined
  const queryTz = typeof routeQuery.tz === 'string' ? routeQuery.tz : undefined
  const timeZone = queryTz || Intl.DateTimeFormat().resolvedOptions().timeZone

  const params: Record<string, string> = { tz: timeZone }
  if (queryWeekStart) {
    params.week_start = queryWeekStart
  }
  if (selectedSubject) {
    params.subject = selectedSubject
  }
  if (selectedTag) {
    params.tag = selectedTag
  }

  return params
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

  const routeWeekStart = computed(() => getWeekStartFromQuery(route.query))
  const routeTimeZone = computed(() => getTimeZoneFromQuery(route.query))
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
    accuracyTrendChartData.value = {
      labels: dailyStatistics.map((entry) => formatDayLabel(entry.date)),
      datasets: [
        {
          label: 'Accuracy',
          data: dailyStatistics.map((entry) => Number((entry.correct_rate * 100).toFixed(1))),
          borderColor: TREND_LINE_COLOR,
          backgroundColor: TREND_FILL_COLOR,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
        },
      ],
    }

    accuracyTrendChartOptions.value = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => `Accuracy ${context.parsed.y}%`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: `${subject} · Weekly Accuracy`,
            font: {
              size: 13,
              weight: 'bold',
            },
          },
        },
        y: {
          grid: {
            color: 'rgba(148, 163, 184, 0.25)',
          },
          title: {
            display: true,
            text: 'Accuracy (%)',
          },
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`,
          },
        },
      },
    }
  }

  const updateAttemptsStackedChart = (dailyStatistics: DailyStatistics[]) => {
    attemptsStackedChartData.value = {
      labels: dailyStatistics.map((entry) => formatDayLabel(entry.date)),
      datasets: [
        {
          label: 'Correct',
          data: dailyStatistics.map((entry) => entry.correct_attempts),
          backgroundColor: CORRECT_BAR_COLOR,
          borderRadius: 8,
        },
        {
          label: 'Incorrect',
          data: dailyStatistics.map((entry) => Math.max(entry.total_attempts - entry.correct_attempts, 0)),
          backgroundColor: INCORRECT_BAR_COLOR,
          borderRadius: 8,
        },
      ],
    }

    attemptsStackedChartOptions.value = {
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            display: false,
          },
          title: {
            display: true,
            text: 'Day',
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.25)',
          },
          title: {
            display: true,
            text: 'Attempts',
          },
        },
      },
    }
  }

  const updateSubjectAccuracyChart = (subjectPerformances: SubjectPerformance[]) => {
    const sortedPerformances = [...subjectPerformances].sort(
      (left, right) => right.accuracyRate - left.accuracyRate,
    )

    subjectAccuracyChartData.value = {
      labels: sortedPerformances.map((entry) => entry.subject),
      datasets: [
        {
          label: 'Accuracy',
          data: sortedPerformances.map((entry) => Number(entry.accuracyRate.toFixed(1))),
          backgroundColor: sortedPerformances.map(
            (_, index) => CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length],
          ),
          borderRadius: 10,
        },
      ],
    }

    subjectAccuracyChartOptions.value = {
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => `Accuracy ${context.parsed.x}%`,
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: {
            color: 'rgba(148, 163, 184, 0.25)',
          },
          ticks: {
            callback: (value) => `${value}%`,
          },
          title: {
            display: true,
            text: 'Accuracy (%)',
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    }
  }

  const updateDistributionChart = (subjectPerformances: SubjectPerformance[]) => {
    const labels = subjectPerformances.map((entry) => entry.subject)
    const totalAttempts = subjectPerformances.reduce((sum, item) => sum + item.totalAttempts, 0)

    const percentages = subjectPerformances.map((entry) =>
      totalAttempts > 0 ? (entry.totalAttempts / totalAttempts) * 100 : 0,
    )

    distributionChartData.value = {
      labels,
      datasets: [
        {
          label: 'Attempts (%)',
          data: percentages,
          backgroundColor: labels.map(
            (_, index) => CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length],
          ),
          hoverBackgroundColor: labels.map(
            (_, index) => CHART_SERIES_HOVER_COLORS[index % CHART_SERIES_HOVER_COLORS.length],
          ),
          borderWidth: 0,
        },
      ],
    }

    distributionChartOptions.value = {
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed.toFixed(1)}%`,
          },
        },
      },
    }
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
    const selectedPerformance = subjectPerformances.find(
      (performance) => performance.subject === selectedSubjectValue,
    )

    const practicedDays = selectedStatistics.value
      ? selectedStatistics.value.daily_statistics.filter((entry) => entry.total_attempts > 0).length
      : 0
    const totalDays = selectedStatistics.value?.daily_statistics.length ?? 0
    const streakDays = selectedStatistics.value
      ? calculateConsecutiveActiveDays(selectedStatistics.value.daily_statistics)
      : 0

    const rankedSubjects = [...subjectPerformances]
      .filter((entry) => entry.totalAttempts > 0)
      .sort((left, right) => right.accuracyRate - left.accuracyRate)

    const selectedRank =
      summary?.subject_rank ??
      summary?.tag_rank ??
      rankedSubjects.findIndex((entry) => entry.subject === selectedSubjectValue) + 1
    const activeSubjectCount = summary?.tag_count ?? summary?.active_subject_count ?? rankedSubjects.length
    const rankLabel = options?.rankLabel ?? 'Subject Ranking'
    const rankUnitLabel = options?.rankUnitLabel ?? 'subjects'
    const defaultRankValue = selectedRank > 0 ? `#${selectedRank}` : '--'
    const defaultRankHelper =
      selectedRank > 0
        ? `Among ${activeSubjectCount} active ${rankUnitLabel} · ${streakDays} day streak`
        : `${streakDays} day streak`
    const defaultRankTone: OverviewKpiCard['tone'] =
      selectedRank > 0 && selectedRank <= 2 ? 'positive' : 'neutral'

    const target = summary?.weekly_goal ?? DEFAULT_WEEKLY_ATTEMPT_GOAL
    const completed = summary?.total_attempts ?? selectedPerformance?.totalAttempts ?? 0

    const accuracyValue = summary
      ? normalizeRate(summary.accuracy_rate) * 100
      : selectedPerformance?.accuracyRate ?? 0
    const correctCount = summary?.correct_attempts ?? selectedPerformance?.correctAttempts ?? 0

    kpiCards.value = [
      {
        id: 'accuracy',
        label: 'Accuracy',
        value: formatRate(accuracyValue),
        helper: completed > 0 ? `${correctCount}/${completed} correct` : 'No attempts this week',
        icon: 'pi pi-chart-line',
        tone: accuracyValue >= 70 ? 'positive' : 'warning',
      },
      {
        id: 'attempts',
        label: 'Attempts',
        value: `${completed}`,
        helper: `Target ${target}/week`,
        icon: 'pi pi-check-square',
        tone: completed >= target ? 'positive' : 'neutral',
      },
      {
        id: 'active-days',
        label: 'Active Days',
        value: `${practicedDays}/${totalDays || 7}`,
        helper: practicedDays >= 5 ? 'Consistency is solid' : 'Add 1-2 extra sessions',
        icon: 'pi pi-calendar',
        tone: practicedDays >= 5 ? 'positive' : 'neutral',
      },
      {
        id: 'ranking',
        label: rankLabel,
        value: options?.rankValue ?? defaultRankValue,
        helper: options?.rankHelper ?? defaultRankHelper,
        icon: 'pi pi-trophy',
        tone: options?.rankTone ?? defaultRankTone,
      },
    ]
  }

  const updateInsights = (selectedSubjectValue: string, subjectPerformances: SubjectPerformance[]) => {
    if (!selectedStatistics.value) {
      insights.value = []
      return
    }

    const selectedDailyStatistics = selectedStatistics.value.daily_statistics
    const sortedByAttempts = [...selectedDailyStatistics].sort(
      (left, right) => right.total_attempts - left.total_attempts,
    )
    const sortedByAccuracy = [...selectedDailyStatistics]
      .filter((entry) => entry.total_attempts > 0)
      .sort((left, right) => left.correct_rate - right.correct_rate)
    const topSubjectByAttempts = [...subjectPerformances].sort(
      (left, right) => right.totalAttempts - left.totalAttempts,
    )[0]

    const insightsPayload: OverviewInsight[] = []

    if (sortedByAttempts[0]?.total_attempts > 0) {
      insightsPayload.push({
        id: 'peak-day',
        title: 'Peak Study Day',
        description: `${formatDateLabel(sortedByAttempts[0].date)} reached ${sortedByAttempts[0].total_attempts} attempts for ${selectedSubjectValue}.`,
        icon: 'pi pi-bolt',
        tone: 'positive',
      })
    }

    if (sortedByAccuracy[0]) {
      insightsPayload.push({
        id: 'weak-day',
        title: 'Most Challenging Day',
        description: `${formatDateLabel(sortedByAccuracy[0].date)} accuracy dropped to ${formatRate(sortedByAccuracy[0].correct_rate * 100)}. Consider a short review.`,
        icon: 'pi pi-exclamation-triangle',
        tone: 'warning',
      })
    }

    if (topSubjectByAttempts) {
      insightsPayload.push({
        id: 'focus-subject',
        title: 'Current Focus',
        description: `${topSubjectByAttempts.subject} has the highest workload (${topSubjectByAttempts.totalAttempts} attempts).`,
        icon: 'pi pi-compass',
        tone: 'neutral',
      })
    }

    if (insightsPayload.length === 0) {
      insightsPayload.push({
        id: 'empty',
        title: 'No Attempts Yet',
        description: `Start practicing ${selectedSubjectValue} to unlock trend insights and suggestions.`,
        icon: 'pi pi-lightbulb',
        tone: 'neutral',
      })
    }

    insights.value = insightsPayload
  }

  const fetchOverviewDashboard = async () => {
    if (isMockMode.value) {
      return buildOverviewDashboardMockData(subjects.value)
    }

    const response = await axios.get<Response<OverviewDashboardData>>('/dashboard/overview', {
      params: buildRequestParams(route.query),
    })

    return response.data.data
  }

  const fetchOverviewSubjectDashboard = async (subject: string) => {
    if (isMockMode.value) {
      return buildOverviewSubjectDashboardMockData(subject, subjects.value)
    }

    const response = await axios.get<Response<OverviewSubjectDashboardData>>('/dashboard/overview/subject', {
      params: buildRequestParams(route.query, subject, getTagFromQuery(route.query)),
    })

    return response.data.data
  }

  const refreshCharts = async () => {
    const requestId = ++latestRequestId.value
    isLoading.value = true
    errorMessage.value = ''

    try {
      const overviewData = await fetchOverviewDashboard()

      if (requestId !== latestRequestId.value) {
        return
      }

      const globalWeeklyGoalTarget = overviewData.summary.weekly_goal ?? DEFAULT_WEEKLY_ATTEMPT_GOAL
      const globalWeeklyGoalCompleted = overviewData.summary.total_attempts ?? 0
      const globalWeeklyGoalProgress =
        typeof overviewData.summary.weekly_goal_progress === 'number'
          ? normalizeProgressPercent(overviewData.summary.weekly_goal_progress)
          : globalWeeklyGoalTarget > 0
            ? (globalWeeklyGoalCompleted / globalWeeklyGoalTarget) * 100
            : 0

      weeklyGoalTarget.value = globalWeeklyGoalTarget
      weeklyGoalCompleted.value = globalWeeklyGoalCompleted
      weeklyGoalProgress.value = Math.min(100, Number(globalWeeklyGoalProgress.toFixed(1)))

      const nextSubjects = Array.from(
        new Set(overviewData.subject_overview.map((entry) => entry.subject).filter((subject) => subject.length > 0)),
      )
      subjects.value = nextSubjects
      const subjectPerformances = buildSubjectPerformanceFromOverview(nextSubjects, overviewData.subject_overview)
      const rankedSubjects = [...subjectPerformances]
        .filter((entry) => entry.totalAttempts > 0)
        .sort((left, right) => right.accuracyRate - left.accuracyRate)
      const selectedSubjectRank =
        rankedSubjects.findIndex((entry) => entry.subject === selectedSubject.value) + 1
      const activeSubjectCount = rankedSubjects.length

      const hasActiveSubject =
        selectedSubject.value.length > 0 && nextSubjects.includes(selectedSubject.value)

      if (selectedSubject.value && !hasActiveSubject) {
        isSubjectPatchedFromResponse.value = true
        selectedSubject.value = ''
      }

      if (!hasActiveSubject) {
        currentSubjectDetail.value = null
        tags.value = []
        selectedTag.value = ''
        selectedStatistics.value = buildStatisticsDataFromOverview(overviewData)
        const focusSubject = overviewData.focus_subject || subjectPerformances[0]?.subject || 'All Subjects'
        const mostPracticedSubject = [...subjectPerformances].sort(
          (left, right) => right.totalAttempts - left.totalAttempts,
        )[0]

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

      const subjectDetail = await fetchOverviewSubjectDashboard(selectedSubject.value)

      if (requestId !== latestRequestId.value) {
        return
      }

      const tagPerformances = buildSubjectPerformanceFromTags(subjectDetail.tag_overview)
      const fallbackTag = [...tagPerformances].sort((left, right) => right.totalAttempts - left.totalAttempts)[0]
      const nextTags = Array.from(
        new Set(subjectDetail.tag_overview.map((entry) => entry.tag).filter((tag) => tag.length > 0)),
      )
      const queryTag = getTagFromQuery(route.query)
      const activeTag =
        [selectedTag.value, queryTag, subjectDetail.focus_tag, fallbackTag?.subject ?? ''].find(
          (tag) => tag.length > 0 && nextTags.includes(tag),
        ) ?? ''

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
        {
          total_attempts: subjectDetail.summary.total_attempts,
          correct_attempts: subjectDetail.summary.correct_attempts,
          accuracy_rate: subjectDetail.summary.accuracy_rate,
          weekly_goal: subjectDetail.summary.weekly_goal,
          weekly_goal_progress: subjectDetail.summary.weekly_goal_progress,
          subject_rank:
            selectedSubjectRank > 0
              ? selectedSubjectRank
              : overviewData.summary.subject_rank,
          active_subject_count:
            activeSubjectCount > 0
              ? activeSubjectCount
              : overviewData.summary.active_subject_count,
        },
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
    if (!selectedSubject.value) return

    const shareText = `Check out my stats for ${selectedSubject.value}!`
    errorMessage.value = ''

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Share My Statistics',
          text: shareText,
          url: window.location.href,
        })
      } catch {
        // User cancelled.
      }
      return
    }

    if (!isClipboardSupported.value) {
      errorMessage.value = 'Sharing is not supported in this browser.'
      return
    }

    try {
      await copyToClipboard(window.location.href)
      errorMessage.value = 'Sharing is not supported. URL copied to clipboard.'
    } catch {
      errorMessage.value = 'Sharing is not supported in this browser.'
    }
  }

  let ignoreSubjectRouteUpdate: (updater: () => void) => void = (updater) => updater()
  let ignoreTagRouteUpdate: (updater: () => void) => void = (updater) => updater()

  watchIgnorable(
    () => route.query,
    (query) => {
      const querySubject = getSubjectFromQuery(query)
      const queryTag = getTagFromQuery(query)

      ignoreSubjectRouteUpdate(() => {
        selectedSubject.value = querySubject
      })

      ignoreTagRouteUpdate(() => {
        selectedTag.value = queryTag
      })
    },
    { immediate: true },
  )

  const { ignoreUpdates: ignoreSubjectSelectionUpdate } = watchIgnorable(
    selectedSubject,
    (subject) => {
      syncRouteSubject(subject)

      if (isSubjectPatchedFromResponse.value) {
        isSubjectPatchedFromResponse.value = false
        return
      }

      isInitialRefreshTriggered.value = true
      void refreshCharts()
    },
    { immediate: true },
  )
  ignoreSubjectRouteUpdate = ignoreSubjectSelectionUpdate

  const { ignoreUpdates: ignoreTagSelectionUpdate } = watchIgnorable(selectedTag, (tag) => {
    if (!isTagView.value) {
      return
    }

    syncRouteTag(tag)

    if (!currentSubjectDetail.value) {
      return
    }

    const tagDailyStatistics = buildStatisticsDataFromSubjectDetail(currentSubjectDetail.value, tag)
    updateAttemptsStackedChart(tagDailyStatistics.daily_statistics)
  })
  ignoreTagRouteUpdate = ignoreTagSelectionUpdate

  watch([routeWeekStart, routeTimeZone], ([nextWeekStart, nextTimeZone], [prevWeekStart, prevTimeZone]) => {
    if (nextWeekStart === prevWeekStart && nextTimeZone === prevTimeZone) {
      return
    }

    if (!isInitialRefreshTriggered.value) {
      return
    }

    void refreshCharts()
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
