import axios from '@/axios'
import type { ProfileTrendData, Response } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { onMounted, shallowRef, watch, type Ref } from 'vue'

interface ProfileActivityDailyEntry {
  date: string
  totalAttempts: number
  correctAttempts: number
}

const CORRECT_BAR_COLOR = '#10B981'
const INCORRECT_BAR_COLOR = '#F59E0B'

const parseDate = (value: string) => {
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
  })
}

const buildFallbackDailyEntries = (): ProfileActivityDailyEntry[] => {
  const entries: ProfileActivityDailyEntry[] = []
  const today = new Date()

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - index)
    entries.push({
      date: date.toISOString().slice(0, 10),
      totalAttempts: 0,
      correctAttempts: 0,
    })
  }

  return entries
}

const sortAndTrimDailyEntries = (entries: ProfileActivityDailyEntry[]) =>
  [...entries]
    .sort((left, right) => {
      const leftTime = parseDate(left.date)?.getTime() ?? 0
      const rightTime = parseDate(right.date)?.getTime() ?? 0
      return leftTime - rightTime
    })
    .slice(-7)

const buildActivityChartData = (entries: ProfileActivityDailyEntry[]): ChartData<'bar'> => {
  const normalizedEntries = entries.length > 0 ? sortAndTrimDailyEntries(entries) : buildFallbackDailyEntries()

  return {
    labels: normalizedEntries.map((entry) => formatDateLabel(entry.date)),
    datasets: [
      {
        label: 'Correct',
        data: normalizedEntries.map((entry) => entry.correctAttempts),
        backgroundColor: CORRECT_BAR_COLOR,
        borderRadius: 8,
      },
      {
        label: 'Incorrect',
        data: normalizedEntries.map((entry) => Math.max(entry.totalAttempts - entry.correctAttempts, 0)),
        backgroundColor: INCORRECT_BAR_COLOR,
        borderRadius: 8,
      },
    ],
  }
}

const buildActivityChartOptions = (): ChartOptions<'bar'> => ({
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'center',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false,
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.22)',
      },
      ticks: {
        precision: 0,
      },
      title: {
        display: true,
        text: 'Attempts',
      },
    },
  },
})

const fetchProfileTrendEntries = async (username: string): Promise<ProfileActivityDailyEntry[]> => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const response = await axios.get<Response<ProfileTrendData>>('/profile/trend', {
    params: {
      username,
      days: 7,
      tz: timeZone,
    },
  })

  return (response.data.data?.daily_trend ?? []).map((entry) => {
    const totalAttempts = Math.max(
      Math.trunc(
        typeof entry.incorrect_attempts === 'number'
          ? entry.correct_attempts + entry.incorrect_attempts
          : entry.total_attempts,
      ),
      0,
    )
    const correctAttempts = Math.min(Math.max(Math.trunc(entry.correct_attempts), 0), totalAttempts)

    return {
      date: entry.date,
      totalAttempts,
      correctAttempts,
    }
  })
}

export const useProfileActivityChart = (username: Ref<string>) => {
  const isActivityLoading = shallowRef(false)
  const activityChartData = shallowRef<ChartData<'bar'>>({ labels: [], datasets: [] })
  const activityChartOptions = shallowRef<ChartOptions<'bar'>>(buildActivityChartOptions())

  const updateActivityChart = (entries: ProfileActivityDailyEntry[]) => {
    activityChartData.value = buildActivityChartData(entries)
  }

  const loadProfileActivityChart = async () => {
    if (!username.value) {
      updateActivityChart(buildFallbackDailyEntries())
      return
    }

    isActivityLoading.value = true

    try {
      const entries = await fetchProfileTrendEntries(username.value).catch(() => null)
      updateActivityChart(entries ?? buildFallbackDailyEntries())
    } catch {
      updateActivityChart(buildFallbackDailyEntries())
    } finally {
      isActivityLoading.value = false
    }
  }

  watch(
    username,
    (nextName, previousName) => {
      if (!nextName || nextName === previousName) return
      void loadProfileActivityChart()
    },
  )

  onMounted(() => {
    void loadProfileActivityChart()
  })

  return {
    isActivityLoading,
    activityChartData,
    activityChartOptions,
    loadProfileActivityChart,
  }
}
