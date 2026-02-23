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

/** 含 weekly_goal 相关字段的数据结构（summary 的最小子集） */
interface WeeklyGoalLike {
  weekly_goal?: number
  total_attempts?: number
  weekly_goal_progress?: number
}

/**
 * 从 summary 对象构建周目标进度状态。
 * - target：目标题数，默认使用 DEFAULT_WEEKLY_ATTEMPT_GOAL；
 * - completed：本周已完成题数；
 * - progress：完成百分比（上限 100%，保留 1 位小数）。
 *
 * 优先使用后端返回的 weekly_goal_progress，
 * 若缺失则由 completed/target 自行计算，避免除零。
 */
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
    // 上限 100%，保留 1 位小数避免浮点噪声
    progress: Math.min(100, Number(progress.toFixed(1))),
  }
}

/**
 * 将字符串数组去重并过滤空字符串，返回新数组。
 * 用于从 tag_overview / subject_overview 中提取唯一有效名称列表。
 */
export const buildUniqueNonEmptyStrings = (values: string[]) =>
  Array.from(new Set(values.filter((value) => value.length > 0)))

/**
 * 在 subjectPerformances 中计算 selectedSubject 的正确率排名。
 * - 只统计有实际作答（totalAttempts > 0）的学科；
 * - 按 accuracyRate 降序排列，rank 从 1 开始；
 * - 若 selectedSubject 不在排名中，selectedSubjectRank 返回 0。
 */
export const buildSubjectRankContext = (
  subjectPerformances: SubjectPerformance[],
  selectedSubject: string,
) => {
  const rankedSubjects = [...subjectPerformances]
    .filter((entry) => entry.totalAttempts > 0)
    .sort((left, right) => right.accuracyRate - left.accuracyRate)

  return {
    // findIndex 返回 -1 时 +1 得 0，调用方以 0 判断"未上榜"
    selectedSubjectRank: rankedSubjects.findIndex((entry) => entry.subject === selectedSubject) + 1,
    activeSubjectCount: rankedSubjects.length,
  }
}

/**
 * 从 subjectPerformances 中找出作答数最多的学科。
 * 用于"当前专注学科"的自动推荐逻辑。
 */
export const pickMostPracticedSubject = (subjectPerformances: SubjectPerformance[]) =>
  [...subjectPerformances].sort((left, right) => right.totalAttempts - left.totalAttempts)[0]

/** resolveActiveTag 的入参 */
interface ResolveActiveTagOptions {
  /** 用户在 UI 中手动选择的标签 */
  selectedTag: string
  /** URL 查询参数中的 tag */
  queryTag: string
  /** 后端返回的 focus_tag（当前学科最活跃标签） */
  focusTag?: string
  /** 兜底标签（如列表第一项） */
  fallbackTag?: string
  /** 当前学科下所有可用标签 */
  availableTags: string[]
}

/**
 * 按优先级解析当前有效标签：
 * selectedTag > queryTag > focusTag > fallbackTag
 * 若候选标签不在 availableTags 中则跳过，全部不命中时返回空字符串。
 */
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

/** buildSubjectRankingSummary 的入参 */
interface BuildSubjectRankingSummaryOptions {
  /** 学科细分仪表板数据 */
  subjectDetail: OverviewSubjectDashboardData
  /** 当前选中学科在所有学科中的排名（0 表示无数据） */
  selectedSubjectRank: number
  /** 有实际作答的学科总数 */
  activeSubjectCount: number
  /** 全局概览的 summary（作为排名的兜底来源） */
  overviewSummary: OverviewDashboardData['summary']
}

/**
 * 将学科细分数据和全局概览数据合并，构建用于 KPI 卡片的 RankingSummary。
 * - 排名字段优先取本地计算的值，若无有效数据则回退到全局 summary 的字段。
 */
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
  // 本地计算的排名优先，为 0（无数据）时回退到全局 summary
  subject_rank:
    selectedSubjectRank > 0 ? selectedSubjectRank : overviewSummary.subject_rank,
  active_subject_count:
    activeSubjectCount > 0 ? activeSubjectCount : overviewSummary.active_subject_count,
})
