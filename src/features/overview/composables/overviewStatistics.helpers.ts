/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 overview 领域的计算、共享与适配能力（模块：overviewStatistics.helpers）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type {
  DailyStatistics,
  OverviewDashboardData,
  OverviewSubjectDashboardData,
  OverviewTagData,
  StatisticsData,
} from '@/types'

/** 学科或标签的做题表现汇总 */
export interface SubjectPerformance {
  /** 学科或标签名称 */
  subject: string
  totalAttempts: number
  correctAttempts: number
  /** 已还原为百分比（0-100），非小数 */
  accuracyRate: number
}

/** 每周默认目标作答题数（后端未配置时的前端兜底值） */
export const DEFAULT_WEEKLY_ATTEMPT_GOAL = 120

// 以下为从路由查询参数中安全提取各字段的工具函数（类型守卫 + 默认值）

/** 从查询参数提取 subject 字段，非字符串时返回空串 */
export const getSubjectFromQuery = (query: Record<string, unknown>) =>
  typeof query.subject === 'string' ? query.subject : ''

/** 从查询参数提取 week_start 字段，用于指定统计周起始日 */
export const getWeekStartFromQuery = (query: Record<string, unknown>) =>
  typeof query.week_start === 'string' ? query.week_start : ''

/** 从查询参数提取 tz（时区）字段 */
export const getTimeZoneFromQuery = (query: Record<string, unknown>) =>
  typeof query.tz === 'string' ? query.tz : ''

/** 从查询参数提取 tag 字段，用于学科内的标签细分 */
export const getTagFromQuery = (query: Record<string, unknown>) =>
  typeof query.tag === 'string' ? query.tag : ''

/**
 * 安全解析日期字符串，兼容仅含日期（"2024-01-01"）和带时间（ISO 8601）两种格式。
 * 解析失败时返回 null。
 */
const parseDate = (value: string) => {
  // 仅含日期时补充 T00:00:00 避免时区偏移导致错误
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? null : date
}

/** 将日期字符串格式化为星期缩写（如 "Mon"），用于图表 X 轴标签 */
export const formatDayLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

/** 将日期字符串格式化为"月 日"形式（如 "Jan 1"），用于 insights 中的日期展示 */
export const formatDateLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** 将日期字符串格式化为"月 日 时:分"形式，用于含时间的详细提示 */
export const formatDateTimeLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 将数值格式化为百分比字符串，如 `formatRate(72.5)` → "72.5%" */
export const formatRate = (value: number, digits = 1) => `${value.toFixed(digits)}%`

/**
 * 将正确率归一化到 [0, 1] 范围。
 * 后端有时返回百分比形式（如 72.5），有时返回小数形式（如 0.725），
 * 此函数统一转换为小数，供内部计算使用。
 */
export const normalizeRate = (rate: number) => (rate > 1 ? rate / 100 : rate)

/**
 * 将进度值归一化到百分比形式（0-100）。
 * 后端可能返回 0-1 的小数，也可能已是 0-100 的整数，统一转换为后者。
 */
export const normalizeProgressPercent = (progress: number) => (progress <= 1 ? progress * 100 : progress)

/**
 * 从每日统计数组末尾开始向前计算连续活跃天数（streak）。
 * 遇到零作答日立即终止，已有 streak 时才中断（避免尾部空日误判）。
 */
export const calculateConsecutiveActiveDays = (dailyStatistics: DailyStatistics[]) => {
  let streak = 0

  for (let index = dailyStatistics.length - 1; index >= 0; index -= 1) {
    if (dailyStatistics[index].total_attempts > 0) {
      streak += 1
      continue
    }

    // 只有在已经开始计数后才中断，防止最后一天是空日时归零
    if (streak > 0) {
      break
    }
  }

  return streak
}

/**
 * 将 daily_overview 数组转换为内部通用的 StatisticsData 格式。
 * correct_rate 由 accuracy_rate 归一化（统一为小数形式）。
 */
export const buildStatisticsDataFromDailyOverview = (
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
    questions_on_date: [], // 此层不关心题目 ID，留空
  })),
})

/** 从全局概览数据提取 StatisticsData（用于图表等通用组件） */
export const buildStatisticsDataFromOverview = (overview: OverviewDashboardData): StatisticsData =>
  buildStatisticsDataFromDailyOverview(
    overview.latest_time,
    overview.start_of_week,
    overview.end_of_week,
    overview.daily_overview,
  )

/**
 * 将后端 subject_overview 数组转换为 SubjectPerformance[]。
 * 以 subjects 列表为基准，对后端没有返回数据的学科填充零值，保证列表完整。
 */
export const buildSubjectPerformanceFromOverview = (
  subjects: string[],
  subjectOverview: OverviewDashboardData['subject_overview'],
): SubjectPerformance[] => {
  // 用 Map 加速后续 O(1) 查找
  const performanceMap = new Map(
    subjectOverview.map((entry) => [
      entry.subject,
      {
        subject: entry.subject,
        totalAttempts: entry.total_attempts,
        correctAttempts: entry.correct_attempts,
        // accuracy_rate 从后端可能是 0-1 小数，乘 100 还原为百分比
        accuracyRate: normalizeRate(entry.accuracy_rate) * 100,
      },
    ]),
  )

  return subjects.map((subject) => {
    const performance = performanceMap.get(subject)
    if (performance) {
      return performance
    }

    // 后端未返回该学科数据，填充零值
    return {
      subject,
      totalAttempts: 0,
      correctAttempts: 0,
      accuracyRate: 0,
    }
  })
}

/**
 * 从学科细分数据中提取 StatisticsData。
 * 若当前有焦点标签（focusTag）且存在 daily_tag_overview，
 * 则仅统计该标签的每日数据；否则使用全学科的 daily_overview。
 */
export const buildStatisticsDataFromSubjectDetail = (
  subjectDetail: OverviewSubjectDashboardData,
  focusTag: string,
): StatisticsData => {
  const hasTagDaily = subjectDetail.daily_tag_overview.length > 0 && focusTag.length > 0

  if (!hasTagDaily) {
    // 无标签细分时直接使用整体每日概览
    return buildStatisticsDataFromDailyOverview(
      subjectDetail.latest_time,
      subjectDetail.start_of_week,
      subjectDetail.end_of_week,
      subjectDetail.daily_overview,
    )
  }

  // 从 daily_tag_overview 中提取指定 focusTag 的每日数据
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

/**
 * 将 tag_overview 数组转换为 SubjectPerformance[]。
 * 复用 SubjectPerformance 结构，其中 subject 字段存放 tag 名称，便于图表等通用组件复用。
 */
export const buildSubjectPerformanceFromTags = (tagOverview: OverviewTagData[]): SubjectPerformance[] =>
  tagOverview.map((entry) => ({
    subject: entry.tag,
    totalAttempts: entry.total_attempts,
    correctAttempts: entry.correct_attempts,
    accuracyRate: normalizeRate(entry.accuracy_rate) * 100,
  }))

/**
 * 构建发送给后端统计接口的请求参数对象。
 * - tz（时区）必填，优先取 URL 中的 tz 参数，否则读取浏览器本地时区；
 * - week_start / subject / tag 为可选过滤条件，缺失时不包含在参数中。
 */
export const buildRequestParams = (
  routeQuery: Record<string, unknown>,
  selectedSubject?: string,
  selectedTag?: string,
): Record<string, string> => {
  const queryWeekStart = typeof routeQuery.week_start === 'string' ? routeQuery.week_start : undefined
  const queryTz = typeof routeQuery.tz === 'string' ? routeQuery.tz : undefined
  // 优先使用 URL 中指定的时区，其次读取浏览器默认时区
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
