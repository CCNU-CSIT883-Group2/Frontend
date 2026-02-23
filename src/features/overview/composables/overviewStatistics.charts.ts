/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 overview 领域的计算、共享与适配能力（模块：overviewStatistics.charts）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type { DailyStatistics } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { formatDayLabel, type SubjectPerformance } from './overviewStatistics.helpers'

/**
 * 多系列图表（分布图/学科准确率图）使用的主色板和悬停色板。
 * 颜色按索引循环取用，适应任意数量的学科/标签。
 */
const CHART_SERIES_COLORS = ['#60A5FA', '#22D3EE', '#34D399', '#FBBF24', '#FB923C', '#A78BFA'] as const
const CHART_SERIES_HOVER_COLORS = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#8B5CF6'] as const

/** 趋势折线图的线条颜色 */
const TREND_LINE_COLOR = '#3B82F6'
/** 趋势折线图的填充区域颜色（带透明度） */
const TREND_FILL_COLOR = 'rgba(59, 130, 246, 0.16)'
/** 堆叠柱状图中"正确"条目的颜色 */
const CORRECT_BAR_COLOR = '#10B981'
/** 堆叠柱状图中"错误"条目的颜色 */
const INCORRECT_BAR_COLOR = '#F59E0B'

/**
 * 构建"正确率趋势"折线图配置（Chart.js line 类型）。
 * X 轴为一周内的日期（星期缩写），Y 轴为 0-100% 正确率。
 * 图表带填充区域以增强视觉层次感。
 */
export const buildAccuracyTrendChart = (subject: string, dailyStatistics: DailyStatistics[]) => ({
  data: {
    labels: dailyStatistics.map((entry) => formatDayLabel(entry.date)),
    datasets: [
      {
        label: 'Accuracy',
        // correct_rate 在 StatisticsData 中为 0-1 小数，乘 100 转为百分比
        data: dailyStatistics.map((entry) => Number((entry.correct_rate * 100).toFixed(1))),
        borderColor: TREND_LINE_COLOR,
        backgroundColor: TREND_FILL_COLOR,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35, // 曲线平滑度
      },
    ],
  } satisfies ChartData<'line'>,
  options: {
    maintainAspectRatio: false, // 由容器控制高度，不锁定宽高比
    plugins: {
      legend: {
        display: false, // 单系列图表不需要图例
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
          display: false, // 隐藏 X 轴网格线，保持简洁
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
          color: 'rgba(148, 163, 184, 0.25)', // 淡灰色网格线
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

/**
 * 构建"每日作答量堆叠柱状图"配置（Chart.js bar 类型，stacked）。
 * 绿色代表正确，黄色代表错误，堆叠后总高度即为当日总作答数。
 */
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
        // 错误数 = 总数 - 正确数，Math.max 防止出现负值（数据异常时的保护）
        data: dailyStatistics.map((entry) => Math.max(entry.total_attempts - entry.correct_attempts, 0)),
        backgroundColor: INCORRECT_BAR_COLOR,
        borderRadius: 8,
      },
    ],
  } satisfies ChartData<'bar'>,
  options: {
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',     // 悬停时同时高亮同一 X 轴下的所有数据点
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

/**
 * 构建"各学科/标签正确率横向柱状图"（Chart.js bar 类型，indexAxis='y'）。
 * 按正确率降序排列，颜色按学科序号循环取自色板。
 */
export const buildSubjectAccuracyChart = (subjectPerformances: SubjectPerformance[]) => {
  // 按正确率降序排列，视觉上最优学科在最上方
  const sortedPerformances = [...subjectPerformances].sort((left, right) => right.accuracyRate - left.accuracyRate)

  return {
    data: {
      labels: sortedPerformances.map((entry) => entry.subject),
      datasets: [
        {
          label: 'Accuracy',
          data: sortedPerformances.map((entry) => Number(entry.accuracyRate.toFixed(1))),
          // 每个条目使用色板中循环对应的颜色
          backgroundColor: sortedPerformances.map(
            (_, index) => CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length],
          ),
          borderRadius: 10,
        },
      ],
    } satisfies ChartData<'bar'>,
    options: {
      maintainAspectRatio: false,
      indexAxis: 'y', // 横向柱状图
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

/**
 * 构建"各学科/标签作答量分布甜甜圈图"（Chart.js doughnut 类型）。
 * 各扇形面积代表该学科占总作答量的百分比。
 */
export const buildDistributionChart = (subjectPerformances: SubjectPerformance[]) => {
  const labels = subjectPerformances.map((entry) => entry.subject)
  const totalAttempts = subjectPerformances.reduce((sum, item) => sum + item.totalAttempts, 0)
  // 将绝对作答数转换为百分比，totalAttempts 为 0 时全部赋 0 防除零
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
          borderWidth: 0, // 去除扇形间的边框
        },
      ],
    } satisfies ChartData<'doughnut', number[], string>,
    options: {
      maintainAspectRatio: false,
      cutout: '68%', // 中心镂空比例，值越大圈越细
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
