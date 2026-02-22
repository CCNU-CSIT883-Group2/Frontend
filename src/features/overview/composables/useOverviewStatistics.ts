import axios from '@/axios'
import { buildOverviewDashboardMockData } from '@/features/overview/mocks/overviewDashboardMock'
import { ROUTE_NAMES } from '@/router'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { useUserStore } from '@/stores/userStore'
import type { DailyStatistics, OverviewDashboardData, Response, StatisticsData } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const CHART_SERIES_COLORS = ['#60A5FA', '#22D3EE', '#34D399', '#FBBF24', '#FB923C', '#A78BFA'] as const
const CHART_SERIES_HOVER_COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#8B5CF6'] as const
const TREND_LINE_COLOR = '#3B82F6'
const TREND_FILL_COLOR = 'rgba(59, 130, 246, 0.16)'
const CORRECT_BAR_COLOR = '#10B981'
const INCORRECT_BAR_COLOR = '#F59E0B'
const WEEKLY_ATTEMPT_GOAL = 120
const USE_OVERVIEW_DASHBOARD_MOCK = import.meta.env.VITE_OVERVIEW_USE_MOCK === 'true'

interface SubjectPerformance {
  subject: string
  totalAttempts: number
  correctAttempts: number
  accuracyRate: number
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
  hasSubjectOptions: ComputedRef<boolean>
  isLoading: Ref<boolean>
  errorMessage: Ref<string>
  dateRangeLabel: ComputedRef<string>
  latestUpdatedLabel: ComputedRef<string>
  kpiCards: Ref<OverviewKpiCard[]>
  insights: Ref<OverviewInsight[]>
  weeklyGoalTarget: number
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

const sumAttempts = (dailyStatistics: DailyStatistics[]) =>
  dailyStatistics.reduce((total, item) => total + item.total_attempts, 0)

const sumCorrectAttempts = (dailyStatistics: DailyStatistics[]) =>
  dailyStatistics.reduce((total, item) => total + item.correct_attempts, 0)

const getSubjectFromQuery = (query: Record<string, unknown>) =>
  typeof query.subject === 'string' ? query.subject : ''

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

const buildSubjectPerformance = (
  subject: string,
  statistics: DailyStatistics[] | undefined,
): SubjectPerformance => {
  const dailyStatistics = statistics ?? []
  const totalAttempts = sumAttempts(dailyStatistics)
  const correctAttempts = sumCorrectAttempts(dailyStatistics)

  return {
    subject,
    totalAttempts,
    correctAttempts,
    accuracyRate: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
  }
}

const normalizeRate = (rate: number) => (rate > 1 ? rate / 100 : rate)

const buildStatisticsDataFromOverview = (overview: OverviewDashboardData): StatisticsData => ({
  latest_time: overview.latest_time,
  start_of_week: overview.start_of_week,
  end_of_week: overview.end_of_week,
  daily_statistics: overview.daily_overview.map((entry) => ({
    date: entry.date,
    total_attempts: entry.total_attempts,
    correct_attempts: entry.correct_attempts,
    correct_rate: normalizeRate(entry.accuracy_rate),
    // Overview API does not currently return per-day question IDs.
    questions_on_date: [],
  })),
})

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

const resolveInsightIcon = (insightId: string, tone: OverviewInsight['tone']) => {
  if (insightId.includes('peak')) return 'pi pi-bolt'
  if (insightId.includes('weak')) return 'pi pi-exclamation-triangle'
  if (insightId.includes('focus')) return 'pi pi-compass'
  if (tone === 'positive') return 'pi pi-bolt'
  if (tone === 'warning') return 'pi pi-exclamation-triangle'
  return 'pi pi-lightbulb'
}

export function useOverviewStatistics(): UseOverviewStatisticsResult {
  const route = useRoute()
  const router = useRouter()

  const historyStore = useQuestionHistoryStore()
  const userStore = useUserStore()
  const { subjects } = storeToRefs(historyStore)
  const { name: usernameRef } = storeToRefs(userStore)

  const selectedSubject = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const latestRequestId = ref(0)

  const selectedStatistics = shallowRef<StatisticsData | null>(null)
  const kpiCards = shallowRef<OverviewKpiCard[]>([])
  const insights = shallowRef<OverviewInsight[]>([])
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

  const routeSubject = computed(() => getSubjectFromQuery(route.query))
  const isMockMode = computed(
    () => USE_OVERVIEW_DASHBOARD_MOCK || route.query.mock === '1' || route.query.mock === 'true',
  )
  const hasSubjectOptions = computed(() => subjects.value.length > 0)
  const dateRangeLabel = computed(() => {
    if (!selectedStatistics.value) return 'No time range'

    return `${formatDateLabel(selectedStatistics.value.start_of_week)} - ${formatDateLabel(selectedStatistics.value.end_of_week)}`
  })
  const latestUpdatedLabel = computed(() => {
    if (!selectedStatistics.value?.latest_time) return 'No updates yet'

    return formatDateTimeLabel(selectedStatistics.value.latest_time)
  })

  const ensureValidSubject = () => {
    if (subjects.value.length === 0) {
      selectedSubject.value = ''
      return
    }

    const preferredSubject = routeSubject.value
    if (preferredSubject && subjects.value.includes(preferredSubject)) {
      selectedSubject.value = preferredSubject
      return
    }

    if (!subjects.value.includes(selectedSubject.value)) {
      selectedSubject.value = subjects.value[0]
    }
  }

  const syncRouteSubject = (subject: string) => {
    if (!subject) return

    const currentRouteSubject = getSubjectFromQuery(route.query)
    if (
      route.name === ROUTE_NAMES.overview &&
      currentRouteSubject === subject &&
      route.query.username === usernameRef.value
    ) {
      return
    }

    void router.replace({
      name: ROUTE_NAMES.overview,
      // Keep route query explicit for deep-linking and sharing.
      query: {
        ...route.query,
        subject,
        username: usernameRef.value,
      },
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

  const updateKpiCards = (selectedSubjectValue: string, subjectPerformances: SubjectPerformance[]) => {
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
    const selectedRank = rankedSubjects.findIndex((entry) => entry.subject === selectedSubjectValue) + 1

    kpiCards.value = [
      {
        id: 'accuracy',
        label: 'Accuracy',
        value: formatRate(selectedPerformance?.accuracyRate ?? 0),
        helper: selectedPerformance?.totalAttempts
          ? `${selectedPerformance.correctAttempts}/${selectedPerformance.totalAttempts} correct`
          : 'No attempts this week',
        icon: 'pi pi-chart-line',
        tone: selectedPerformance && selectedPerformance.accuracyRate >= 70 ? 'positive' : 'warning',
      },
      {
        id: 'attempts',
        label: 'Attempts',
        value: `${selectedPerformance?.totalAttempts ?? 0}`,
        helper: `Target ${WEEKLY_ATTEMPT_GOAL}/week`,
        icon: 'pi pi-check-square',
        tone:
          selectedPerformance && selectedPerformance.totalAttempts >= WEEKLY_ATTEMPT_GOAL
            ? 'positive'
            : 'neutral',
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
        label: 'Subject Ranking',
        value: selectedRank > 0 ? `#${selectedRank}` : '--',
        helper:
          selectedRank > 0
            ? `Among ${rankedSubjects.length} active subjects · ${streakDays} day streak`
            : `${streakDays} day streak`,
        icon: 'pi pi-trophy',
        tone: selectedRank > 0 && selectedRank <= 2 ? 'positive' : 'neutral',
      },
    ]

    weeklyGoalCompleted.value = selectedPerformance?.totalAttempts ?? 0
    weeklyGoalProgress.value = Math.min(
      100,
      Number((((selectedPerformance?.totalAttempts ?? 0) / WEEKLY_ATTEMPT_GOAL) * 100).toFixed(1)),
    )
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

  const applyOverviewInsights = (overviewInsights: OverviewDashboardData['insights']) => {
    insights.value = overviewInsights.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      tone: entry.tone,
      icon: resolveInsightIcon(entry.id, entry.tone),
    }))
  }

  const fetchOverviewDashboard = async (subject: string) => {
    if (isMockMode.value) {
      return buildOverviewDashboardMockData(subject, subjects.value)
    }

    const response = await axios.get<Response<OverviewDashboardData>>('/dashboard/overview', {
      params: {
        username: usernameRef.value,
        subject,
      },
    })

    return response.data.data
  }

  const fetchSubjectStatistics = async (subject: string) => {
    const response = await axios.get<Response<StatisticsData>>('/statistics', {
      params: {
        username: usernameRef.value,
        subject,
      },
    })

    return response.data.data
  }

  const fetchLegacyStatisticsBundle = async (selectedSubjectValue: string) => {
    const [selectedStatisticsData, allSubjectStatistics] = await Promise.all([
      fetchSubjectStatistics(selectedSubjectValue),
      Promise.all(
        subjects.value.map(async (subject) => {
          try {
            const statistics = await fetchSubjectStatistics(subject)
            return [subject, statistics] as const
          } catch {
            return [subject, null] as const
          }
        }),
      ),
    ])

    const statisticsMap = new Map<string, StatisticsData>()
    allSubjectStatistics.forEach(([subject, statistics]) => {
      if (statistics) {
        statisticsMap.set(subject, statistics)
      }
    })
    statisticsMap.set(selectedSubjectValue, selectedStatisticsData)

    const subjectPerformances = subjects.value.map((subject) =>
      buildSubjectPerformance(subject, statisticsMap.get(subject)?.daily_statistics),
    )

    return {
      selectedStatisticsData,
      subjectPerformances,
    }
  }

  const refreshCharts = async () => {
    if (!usernameRef.value || !selectedSubject.value || subjects.value.length === 0) {
      return
    }

    const requestId = ++latestRequestId.value
    isLoading.value = true
    errorMessage.value = ''

    try {
      let selectedStatisticsData: StatisticsData
      let subjectPerformances: SubjectPerformance[]
      let shouldBuildClientInsights = true

      try {
        const overviewData = await fetchOverviewDashboard(selectedSubject.value)
        selectedStatisticsData = buildStatisticsDataFromOverview(overviewData)
        subjectPerformances = buildSubjectPerformanceFromOverview(
          subjects.value,
          overviewData.subject_overview,
        )

        if (overviewData.insights.length > 0) {
          applyOverviewInsights(overviewData.insights)
          shouldBuildClientInsights = false
        }
      } catch {
        if (import.meta.env.DEV) {
          const mockOverviewData = buildOverviewDashboardMockData(selectedSubject.value, subjects.value)
          selectedStatisticsData = buildStatisticsDataFromOverview(mockOverviewData)
          subjectPerformances = buildSubjectPerformanceFromOverview(
            subjects.value,
            mockOverviewData.subject_overview,
          )
          applyOverviewInsights(mockOverviewData.insights)
          shouldBuildClientInsights = false
          console.warn(
            '[overview] /dashboard/overview unavailable, switched to local mock data.',
          )
        } else {
          const legacyBundle = await fetchLegacyStatisticsBundle(selectedSubject.value)
          selectedStatisticsData = legacyBundle.selectedStatisticsData
          subjectPerformances = legacyBundle.subjectPerformances
        }
      }

      if (requestId !== latestRequestId.value) {
        return
      }

      selectedStatistics.value = selectedStatisticsData

      updateAccuracyTrendChart(selectedSubject.value, selectedStatisticsData.daily_statistics)
      updateAttemptsStackedChart(selectedStatisticsData.daily_statistics)
      updateSubjectAccuracyChart(subjectPerformances)
      updateDistributionChart(subjectPerformances)
      updateKpiCards(selectedSubject.value, subjectPerformances)

      if (shouldBuildClientInsights) {
        updateInsights(selectedSubject.value, subjectPerformances)
      }
    } catch {
      if (requestId !== latestRequestId.value) {
        return
      }

      errorMessage.value = 'Failed to load statistics. Please try again later.'
    } finally {
      if (requestId === latestRequestId.value) {
        isLoading.value = false
      }
    }
  }

  const shareCurrentStatistics = async () => {
    if (!selectedSubject.value) return

    const shareText = `Check out my stats for ${selectedSubject.value}!`

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

    try {
      await navigator.clipboard.writeText(window.location.href)
      errorMessage.value = 'Sharing is not supported. URL copied to clipboard.'
    } catch {
      errorMessage.value = 'Sharing is not supported in this browser.'
    }
  }

  watch(subjects, ensureValidSubject)

  watch(
    () => route.query,
    (query) => {
      const querySubject = getSubjectFromQuery(query)
      if (!querySubject) return
      if (querySubject !== selectedSubject.value) {
        selectedSubject.value = querySubject
      }
    },
    { immediate: true },
  )

  watch(selectedSubject, (subject) => {
    if (!subject) return

    syncRouteSubject(subject)
    void refreshCharts()
  })

  onMounted(async () => {
    const error = await historyStore.fetchHistories()
    if (error) {
      errorMessage.value = error
      return
    }

    ensureValidSubject()
    await refreshCharts()
  })

  return {
    selectedSubject,
    subjects,
    hasSubjectOptions,
    isLoading,
    errorMessage,
    dateRangeLabel,
    latestUpdatedLabel,
    kpiCards,
    insights,
    weeklyGoalTarget: WEEKLY_ATTEMPT_GOAL,
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
