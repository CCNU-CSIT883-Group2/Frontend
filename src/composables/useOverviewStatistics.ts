import axios from '@/axios'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import type { DailyStatistics, Response, StatisticsData } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const PIE_COLORS = ['#FF8C97', '#5F91C4', '#FFB732', '#65B3A1', '#845EC2', '#2C73D2']
const PIE_HOVER_COLORS = ['#FFB2C3', '#7DAFDC', '#FFCF6D', '#80C9B5', '#9B7BCE', '#4C8DDD']

function sumAttempts(dailyStatistics: DailyStatistics[]) {
  return dailyStatistics.reduce((total, item) => total + item.total_attempts, 0)
}

interface UseOverviewStatisticsResult {
  selectedSubject: Ref<string>
  subjects: Ref<string[]>
  hasSubjectOptions: ComputedRef<boolean>
  isLoading: Ref<boolean>
  errorMessage: Ref<string>
  lineChartData: Ref<ChartData<'line'>>
  lineChartOptions: Ref<ChartOptions<'line'>>
  pieChartData: Ref<ChartData<'pie', number[], string>>
  pieChartOptions: Ref<ChartOptions<'pie'>>
  shareCurrentStatistics: () => Promise<void>
}

export function useOverviewStatistics(): UseOverviewStatisticsResult {
  const route = useRoute()
  const router = useRouter()

  const historyStore = useQuestionHistoryStore()
  const { subjects } = storeToRefs(historyStore)

  const username = ref(localStorage.getItem('username') ?? '')
  const selectedSubject = ref<string>('')
  const isLoading = ref(false)
  const errorMessage = ref('')

  const lineChartData = ref<ChartData<'line'>>({
    labels: [],
    datasets: [],
  })
  const lineChartOptions = ref<ChartOptions<'line'>>({})

  const pieChartData = ref<ChartData<'pie', number[], string>>({
    labels: [],
    datasets: [],
  })
  const pieChartOptions = ref<ChartOptions<'pie'>>({})

  const routeSubject = computed(() =>
    typeof route.query.subjects === 'string' ? route.query.subjects : '',
  )

  const hasSubjectOptions = computed(() => subjects.value.length > 0)

  const ensureValidSubject = () => {
    if (!subjects.value.length) return

    const preferred = routeSubject.value
    if (preferred && subjects.value.includes(preferred)) {
      selectedSubject.value = preferred
      return
    }

    if (!subjects.value.includes(selectedSubject.value)) {
      selectedSubject.value = subjects.value[0]
    }
  }

  const syncRouteSubject = (subject: string) => {
    if (
      route.name === 'overview' &&
      route.query.subjects === subject &&
      route.query.username === username.value
    ) {
      return
    }

    router.replace({
      name: 'overview',
      query: {
        subjects: subject,
        username: username.value,
      },
    })
  }

  const updateLineChart = (subject: string, dailyStatistics: DailyStatistics[]) => {
    lineChartData.value = {
      labels: dailyStatistics.map((entry) => entry.date),
      datasets: [
        {
          label: 'Correct Rate (%)',
          data: dailyStatistics.map((entry) => Math.round(entry.correct_rate * 100)),
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.4,
        },
      ],
    }

    lineChartOptions.value = {
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: `Accuracy (%) of ${subject} during this week`,
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              bottom: 16,
            },
          },
        },
        y: {
          title: {
            display: true,
            text: 'Correct Rate (%)',
          },
          min: 0,
          max: 100,
        },
      },
    }
  }

  const updatePieChart = (subjectTotalAttempts: Record<string, number>) => {
    const labels = [...subjects.value]
    const totalAttempts = Object.values(subjectTotalAttempts).reduce((sum, attempts) => sum + attempts, 0)
    const percentages = labels.map((subject) => {
      const attempts = subjectTotalAttempts[subject] ?? 0
      return totalAttempts > 0 ? (attempts / totalAttempts) * 100 : 0
    })

    pieChartData.value = {
      labels,
      datasets: [
        {
          label: 'Attempts (%)',
          data: percentages,
          backgroundColor: labels.map((_, index) => PIE_COLORS[index % PIE_COLORS.length]),
          hoverBackgroundColor: labels.map((_, index) => PIE_HOVER_COLORS[index % PIE_HOVER_COLORS.length]),
        },
      ],
    }

    pieChartOptions.value = {
      plugins: {
        title: {
          display: true,
          text: 'Attempt Distribution by Subject (%)',
          font: {
            size: 16,
            weight: 'bold',
          },
          padding: {
            bottom: 16,
          },
        },
        legend: {
          position: 'top',
        },
      },
    }
  }

  const fetchSubjectStatistics = async (subject: string) => {
    const response = await axios.get<Response<StatisticsData>>('/statistics', {
      params: {
        username: username.value,
        subject,
      },
    })

    return response.data.data.daily_statistics
  }

  const refreshCharts = async () => {
    if (!username.value || !selectedSubject.value) return

    isLoading.value = true
    errorMessage.value = ''

    try {
      const [selectedDailyStatistics, allSubjectStatistics] = await Promise.all([
        fetchSubjectStatistics(selectedSubject.value),
        Promise.all(
          subjects.value.map(async (subject) => {
            try {
              const dailyStatistics = await fetchSubjectStatistics(subject)
              return [subject, sumAttempts(dailyStatistics)] as const
            } catch {
              return [subject, 0] as const
            }
          }),
        ),
      ])

      updateLineChart(selectedSubject.value, selectedDailyStatistics)
      updatePieChart(Object.fromEntries(allSubjectStatistics))
    } catch {
      errorMessage.value = 'Failed to load statistics. Please try again later.'
    } finally {
      isLoading.value = false
    }
  }

  const shareCurrentStatistics = async () => {
    if (!selectedSubject.value) return

    if (!navigator.share) {
      alert('Sharing is not supported in this browser.')
      return
    }

    try {
      await navigator.share({
        title: 'Share My Statistics',
        text: `Check out my stats for ${selectedSubject.value}!`,
        url: window.location.href,
      })
    } catch {
      // user canceled share, ignore
    }
  }

  watch(subjects, () => {
    ensureValidSubject()
  })

  watch(
    () => route.query.subjects,
    (querySubject) => {
      if (typeof querySubject !== 'string') return
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

  onMounted(() => {
    historyStore.fetch()
    ensureValidSubject()
  })

  return {
    selectedSubject,
    subjects,
    hasSubjectOptions,
    isLoading,
    errorMessage,
    lineChartData,
    lineChartOptions,
    pieChartData,
    pieChartOptions,
    shareCurrentStatistics,
  }
}
