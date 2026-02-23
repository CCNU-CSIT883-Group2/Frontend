/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 profile 领域的计算、共享与适配能力（模块：profileActivityChart）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import type { ProfileTrendData, Response } from '@/types'
import type { ChartData, ChartOptions } from 'chart.js'
import { onMounted, shallowRef, watch, type Ref } from 'vue'

/** 每日活跃度统计条目（内部格式，已从后端数据归一化） */
interface ProfileActivityDailyEntry {
  date: string
  totalAttempts: number
  correctAttempts: number
}

/** 堆叠柱状图中"正确"条目的颜色 */
const CORRECT_BAR_COLOR = '#10B981'
/** 堆叠柱状图中"错误"条目的颜色 */
const INCORRECT_BAR_COLOR = '#F59E0B'

/**
 * 安全解析日期字符串。
 * 仅含日期（"2024-01-01"）时补充时间部分，防止时区偏移导致日期错误。
 */
const parseDate = (value: string) => {
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 将日期字符串格式化为"月/日"简短形式（如 "1/1"），用于图表 X 轴 */
const formatDateLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
  })
}

/**
 * 构建最近 7 天的零值兜底数据。
 * 在后端接口失败或 username 为空时使用，确保图表始终有数据展示。
 */
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

/**
 * 对条目按日期升序排序并只保留最近 7 天。
 * 防止后端返回乱序或超过 7 天的数据导致图表异常。
 */
const sortAndTrimDailyEntries = (entries: ProfileActivityDailyEntry[]) =>
  [...entries]
    .sort((left, right) => {
      const leftTime = parseDate(left.date)?.getTime() ?? 0
      const rightTime = parseDate(right.date)?.getTime() ?? 0
      return leftTime - rightTime
    })
    .slice(-7)

/**
 * 根据日常条目列表构建 Chart.js 堆叠柱状图数据。
 * 若条目为空则使用兜底数据，确保图表不出现"无数据"空白。
 */
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
        // 错误数 = 总数 - 正确数，Math.max 防止数据异常时出现负值
        data: normalizedEntries.map((entry) => Math.max(entry.totalAttempts - entry.correctAttempts, 0)),
        backgroundColor: INCORRECT_BAR_COLOR,
        borderRadius: 8,
      },
    ],
  }
}

/** 构建图表选项（静态，不依赖运行时数据） */
const buildActivityChartOptions = (): ChartOptions<'bar'> => ({
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',     // 悬停时同时高亮同一日期的所有条
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      align: 'center',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle', // 用圆形图例点替代默认方块
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: false, // 隐藏 X 轴网格线
      },
    },
    y: {
      stacked: true,
      beginAtZero: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.22)',
      },
      ticks: {
        precision: 0, // Y 轴只显示整数刻度
      },
      title: {
        display: true,
        text: 'Attempts',
      },
    },
  },
})

/**
 * 从后端 /profile/trend 接口获取最近 N 天的每日作答趋势。
 * 将后端字段（correct_attempts / incorrect_attempts）归一化为内部格式：
 * - totalAttempts 优先取 correct + incorrect，次选 total_attempts；
 * - 均取整且不允许负数，避免浮点或数据异常导致图表错误。
 */
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
    // totalAttempts：优先 correct + incorrect（更精确），兜底 total_attempts
    const totalAttempts = Math.max(
      Math.trunc(
        typeof entry.incorrect_attempts === 'number'
          ? entry.correct_attempts + entry.incorrect_attempts
          : entry.total_attempts,
      ),
      0,
    )
    // correctAttempts 不得超过 totalAttempts
    const correctAttempts = Math.min(Math.max(Math.trunc(entry.correct_attempts), 0), totalAttempts)

    return {
      date: entry.date,
      totalAttempts,
      correctAttempts,
    }
  })
}

/**
 * 用户活跃度图表 composable。
 * 功能：
 * 1. 组件挂载时自动加载图表数据；
 * 2. username 发生变化时重新加载（用于账号切换场景）；
 * 3. 接口失败时展示兜底空数据，不影响页面正常渲染。
 */
export const useProfileActivityChart = (username: Ref<string>) => {
  /** 图表数据是否正在加载 */
  const isActivityLoading = shallowRef(false)
  /** 图表的 data 配置（shallowRef 减少深层响应性开销） */
  const activityChartData = shallowRef<ChartData<'bar'>>({ labels: [], datasets: [] })
  /** 图表的 options 配置（静态，初始化一次即可） */
  const activityChartOptions = shallowRef<ChartOptions<'bar'>>(buildActivityChartOptions())

  /** 将条目写入图表数据 ref */
  const updateActivityChart = (entries: ProfileActivityDailyEntry[]) => {
    activityChartData.value = buildActivityChartData(entries)
  }

  /** 请求后端趋势数据并更新图表；username 为空时使用兜底数据 */
  const loadProfileActivityChart = async () => {
    if (!username.value) {
      updateActivityChart(buildFallbackDailyEntries())
      return
    }

    isActivityLoading.value = true

    try {
      // catch 内返回 null，确保外层 try 始终得到兜底数据
      const entries = await fetchProfileTrendEntries(username.value).catch(() => null)
      updateActivityChart(entries ?? buildFallbackDailyEntries())
    } catch {
      updateActivityChart(buildFallbackDailyEntries())
    } finally {
      isActivityLoading.value = false
    }
  }

  // username 变化时重新加载（只有值真正变化且非空时触发）
  watch(
    username,
    (nextName, previousName) => {
      if (!nextName || nextName === previousName) return
      void loadProfileActivityChart()
    },
  )

  // 组件挂载时加载初始数据
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
