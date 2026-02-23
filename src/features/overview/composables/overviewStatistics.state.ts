/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 overview 领域的计算、共享与适配能力（模块：overviewStatistics.state）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type { OverviewDashboardData, OverviewSubjectDashboardData } from '@/types'
import {
  DEFAULT_WEEKLY_ATTEMPT_GOAL,
  normalizeProgressPercent,
  type SubjectPerformance,
} from '@/features/overview/composables/overviewStatistics.helpers'
import type { RankingSummary } from '@/features/overview/composables/overviewStatistics.presentation'

interface WeeklyGoalLike {
  weekly_goal?: number
  total_attempts?: number
  weekly_goal_progress?: number
}

export const buildWeeklyGoalState = (summary: WeeklyGoalLike) => {
  const target = summary.weekly_goal ?? DEFAULT_WEEKLY_ATTEMPT_GOAL
  const completed = summary.total_attempts ?? 0
  const progress =
    typeof summary.weekly_goal_progress === 'number'
      ? normalizeProgressPercent(summary.weekly_goal_progress)
      : target > 0
        ? (completed / target) * 100
        : 0

  return {
    target,
    completed,
    progress: Math.min(100, Number(progress.toFixed(1))),
  }
}

export const buildUniqueNonEmptyStrings = (values: string[]) =>
  Array.from(new Set(values.filter((value) => value.length > 0)))

export const buildSubjectRankContext = (
  subjectPerformances: SubjectPerformance[],
  selectedSubject: string,
) => {
  const rankedSubjects = [...subjectPerformances]
    .filter((entry) => entry.totalAttempts > 0)
    .sort((left, right) => right.accuracyRate - left.accuracyRate)

  return {
    selectedSubjectRank: rankedSubjects.findIndex((entry) => entry.subject === selectedSubject) + 1,
    activeSubjectCount: rankedSubjects.length,
  }
}

export const pickMostPracticedSubject = (subjectPerformances: SubjectPerformance[]) =>
  [...subjectPerformances].sort((left, right) => right.totalAttempts - left.totalAttempts)[0]

interface ResolveActiveTagOptions {
  selectedTag: string
  queryTag: string
  focusTag?: string
  fallbackTag?: string
  availableTags: string[]
}

export const resolveActiveTag = ({
  selectedTag,
  queryTag,
  focusTag = '',
  fallbackTag = '',
  availableTags,
}: ResolveActiveTagOptions) =>
  [selectedTag, queryTag, focusTag, fallbackTag].find(
    (tag) => tag.length > 0 && availableTags.includes(tag),
  ) ?? ''

interface BuildSubjectRankingSummaryOptions {
  subjectDetail: OverviewSubjectDashboardData
  selectedSubjectRank: number
  activeSubjectCount: number
  overviewSummary: OverviewDashboardData['summary']
}

export const buildSubjectRankingSummary = ({
  subjectDetail,
  selectedSubjectRank,
  activeSubjectCount,
  overviewSummary,
}: BuildSubjectRankingSummaryOptions): RankingSummary => ({
  total_attempts: subjectDetail.summary.total_attempts,
  correct_attempts: subjectDetail.summary.correct_attempts,
  accuracy_rate: subjectDetail.summary.accuracy_rate,
  weekly_goal: subjectDetail.summary.weekly_goal,
  weekly_goal_progress: subjectDetail.summary.weekly_goal_progress,
  subject_rank:
    selectedSubjectRank > 0 ? selectedSubjectRank : overviewSummary.subject_rank,
  active_subject_count:
    activeSubjectCount > 0 ? activeSubjectCount : overviewSummary.active_subject_count,
})
