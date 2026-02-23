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

export interface SubjectPerformance {
  subject: string
  totalAttempts: number
  correctAttempts: number
  accuracyRate: number
}

export const DEFAULT_WEEKLY_ATTEMPT_GOAL = 120

export const getSubjectFromQuery = (query: Record<string, unknown>) =>
  typeof query.subject === 'string' ? query.subject : ''

export const getWeekStartFromQuery = (query: Record<string, unknown>) =>
  typeof query.week_start === 'string' ? query.week_start : ''

export const getTimeZoneFromQuery = (query: Record<string, unknown>) =>
  typeof query.tz === 'string' ? query.tz : ''

export const getTagFromQuery = (query: Record<string, unknown>) =>
  typeof query.tag === 'string' ? query.tag : ''

const parseDate = (value: string) => {
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? null : date
}

export const formatDayLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

export const formatDateLabel = (value: string) => {
  const date = parseDate(value)
  if (!date) return value

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

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

export const formatRate = (value: number, digits = 1) => `${value.toFixed(digits)}%`

export const normalizeRate = (rate: number) => (rate > 1 ? rate / 100 : rate)

export const normalizeProgressPercent = (progress: number) => (progress <= 1 ? progress * 100 : progress)

export const calculateConsecutiveActiveDays = (dailyStatistics: DailyStatistics[]) => {
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
    questions_on_date: [],
  })),
})

export const buildStatisticsDataFromOverview = (overview: OverviewDashboardData): StatisticsData =>
  buildStatisticsDataFromDailyOverview(
    overview.latest_time,
    overview.start_of_week,
    overview.end_of_week,
    overview.daily_overview,
  )

export const buildSubjectPerformanceFromOverview = (
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

export const buildStatisticsDataFromSubjectDetail = (
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

export const buildSubjectPerformanceFromTags = (tagOverview: OverviewTagData[]): SubjectPerformance[] =>
  tagOverview.map((entry) => ({
    subject: entry.tag,
    totalAttempts: entry.total_attempts,
    correctAttempts: entry.correct_attempts,
    accuracyRate: normalizeRate(entry.accuracy_rate) * 100,
  }))

export const buildRequestParams = (
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
