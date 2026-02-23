import type { DailyStatistics } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { formatDayLabel, type SubjectPerformance } from './overviewStatistics.helpers'

const CHART_SERIES_COLORS = ['#60A5FA', '#22D3EE', '#34D399', '#FBBF24', '#FB923C', '#A78BFA'] as const
const CHART_SERIES_HOVER_COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#8B5CF6'] as const
const TREND_LINE_COLOR = '#3B82F6'
const TREND_FILL_COLOR = 'rgba(59, 130, 246, 0.16)'
const CORRECT_BAR_COLOR = '#10B981'
const INCORRECT_BAR_COLOR = '#F59E0B'

export const buildAccuracyTrendChart = (subject: string, dailyStatistics: DailyStatistics[]) => ({
  data: {
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
  } satisfies ChartData<'line'>,
  options: {
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
  } satisfies ChartOptions<'line'>,
})

export const buildAttemptsStackedChart = (dailyStatistics: DailyStatistics[]) => ({
  data: {
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
  } satisfies ChartData<'bar'>,
  options: {
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
  } satisfies ChartOptions<'bar'>,
})

export const buildSubjectAccuracyChart = (subjectPerformances: SubjectPerformance[]) => {
  const sortedPerformances = [...subjectPerformances].sort((left, right) => right.accuracyRate - left.accuracyRate)

  return {
    data: {
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
    } satisfies ChartData<'bar'>,
    options: {
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
    } satisfies ChartOptions<'bar'>,
  }
}

export const buildDistributionChart = (subjectPerformances: SubjectPerformance[]) => {
  const labels = subjectPerformances.map((entry) => entry.subject)
  const totalAttempts = subjectPerformances.reduce((sum, item) => sum + item.totalAttempts, 0)
  const percentages = subjectPerformances.map((entry) =>
    totalAttempts > 0 ? (entry.totalAttempts / totalAttempts) * 100 : 0,
  )

  return {
    data: {
      labels,
      datasets: [
        {
          label: 'Attempts (%)',
          data: percentages,
          backgroundColor: labels.map((_, index) => CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]),
          hoverBackgroundColor: labels.map(
            (_, index) => CHART_SERIES_HOVER_COLORS[index % CHART_SERIES_HOVER_COLORS.length],
          ),
          borderWidth: 0,
        },
      ],
    } satisfies ChartData<'doughnut', number[], string>,
    options: {
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
    } satisfies ChartOptions<'doughnut'>,
  }
}
