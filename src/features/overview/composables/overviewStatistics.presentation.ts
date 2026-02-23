/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 overview 领域的计算、共享与适配能力（模块：overviewStatistics.presentation）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type { StatisticsData } from '@/types'
import {
  DEFAULT_WEEKLY_ATTEMPT_GOAL,
  calculateConsecutiveActiveDays,
  formatDateLabel,
  formatRate,
  normalizeRate,
  type SubjectPerformance,
} from '@/features/overview/composables/overviewStatistics.helpers'

/** 排名与汇总信息（来自 overview/subject 接口 summary 的共享子集） */
export interface RankingSummary {
  /** 总作答数 */
  total_attempts: number
  /** 总正确数 */
  correct_attempts: number
  /** 正确率（后端可能返回 0-1 或 0-100，消费时会归一化） */
  accuracy_rate: number
  /** 周目标题数 */
  weekly_goal: number
  /** 周目标进度（后端格式不固定，消费时会归一化） */
  weekly_goal_progress: number
  /** 当前学科在所有学科中的排名（可选） */
  subject_rank?: number
  /** 有实际作答的学科总数（可选） */
  active_subject_count?: number
  /** 当前标签在同学科标签中的排名（可选） */
  tag_rank?: number
  /** 有实际作答的标签总数（可选） */
  tag_count?: number
}

/** KPI 卡片展示模型 */
export interface OverviewKpiCard {
  /** 卡片唯一标识 */
  id: string
  /** 卡片标题 */
  label: string
  /** 主数值文本 */
  value: string
  /** 辅助说明文本 */
  helper: string
  /** PrimeIcons 图标类名 */
  icon: string
  /** 视觉语义色调（用于样式映射） */
  tone: 'positive' | 'neutral' | 'warning'
}

/** 洞察建议展示模型 */
export interface OverviewInsight {
  /** 洞察唯一标识 */
  id: string
  /** 洞察标题 */
  title: string
  /** 洞察描述 */
  description: string
  /** PrimeIcons 图标类名 */
  icon: string
  /** 视觉语义色调（用于样式映射） */
  tone: 'positive' | 'neutral' | 'warning'
}

/** buildOverviewKpiCards 的入参 */
interface BuildOverviewKpiOptions {
  /** 当前选中的学科（全科视图时通常为 focus subject） */
  selectedSubject: string
  /** 学科或标签维度的表现列表（已转换为统一结构） */
  subjectPerformances: SubjectPerformance[]
  /** 当前统计周期数据 */
  selectedStatistics: StatisticsData | null
  /** 后端 summary（可选，存在时优先用于卡片数值） */
  summary?: RankingSummary
  /** 允许调用方覆写“排名卡”文案与色调 */
  options?: {
    /** 排名卡标题 */
    rankLabel?: string
    /** 排名单位（如 subjects/tags） */
    rankUnitLabel?: string
    /** 排名主值（如 #1 或自定义文本） */
    rankValue?: string
    /** 排名辅助说明 */
    rankHelper?: string
    /** 排名卡语义色调 */
    rankTone?: OverviewKpiCard['tone']
  }
}

/**
 * 组装顶部 KPI 卡片数据。
 *
 * 设计要点：
 * 1. 优先使用后端 summary，确保展示与服务端统计口径一致；
 * 2. summary 缺失时回退到本地聚合结果，保障页面在边界场景可用；
 * 3. 排名卡支持调用方覆写文案，用于“学科排名/最常练学科”等不同视图复用。
 */
export const buildOverviewKpiCards = ({
  selectedSubject,
  subjectPerformances,
  selectedStatistics,
  summary,
  options,
}: BuildOverviewKpiOptions): OverviewKpiCard[] => {
  // 当前学科在本地聚合数据中的表现（summary 缺失时作为兜底）
  const selectedPerformance = subjectPerformances.find(
    (performance) => performance.subject === selectedSubject,
  )

  // 活跃天数：以 total_attempts > 0 作为“当天有练习”的判断标准
  const practicedDays = selectedStatistics
    ? selectedStatistics.daily_statistics.filter((entry) => entry.total_attempts > 0).length
    : 0
  const totalDays = selectedStatistics?.daily_statistics.length ?? 0
  // 连续活跃天数（从周期末尾向前计算）
  const streakDays = selectedStatistics
    ? calculateConsecutiveActiveDays(selectedStatistics.daily_statistics)
    : 0

  // 仅统计有作答数据的项，按正确率降序用于计算默认排名
  const rankedSubjects = [...subjectPerformances]
    .filter((entry) => entry.totalAttempts > 0)
    .sort((left, right) => right.accuracyRate - left.accuracyRate)

  // 排名优先级：subject_rank > tag_rank > 本地计算
  const selectedRank =
    summary?.subject_rank ??
    summary?.tag_rank ??
    rankedSubjects.findIndex((entry) => entry.subject === selectedSubject) + 1
  // 计数优先级：tag_count > active_subject_count > 本地计算
  const activeSubjectCount = summary?.tag_count ?? summary?.active_subject_count ?? rankedSubjects.length
  const rankLabel = options?.rankLabel ?? 'Subject Ranking'
  const rankUnitLabel = options?.rankUnitLabel ?? 'subjects'
  const defaultRankValue = selectedRank > 0 ? `#${selectedRank}` : '--'
  const defaultRankHelper =
    selectedRank > 0
      ? `Among ${activeSubjectCount} active ${rankUnitLabel} · ${streakDays} day streak`
      : `${streakDays} day streak`
  const defaultRankTone: OverviewKpiCard['tone'] =
    selectedRank > 0 && selectedRank <= 2 ? 'positive' : 'neutral'

  // 目标值和完成值：优先后端 summary，缺失时回退本地数据
  const target = summary?.weekly_goal ?? DEFAULT_WEEKLY_ATTEMPT_GOAL
  const completed = summary?.total_attempts ?? selectedPerformance?.totalAttempts ?? 0

  // accuracy_rate 统一转换为百分比展示（0-100）
  const accuracyValue = summary
    ? normalizeRate(summary.accuracy_rate) * 100
    : selectedPerformance?.accuracyRate ?? 0
  const correctCount = summary?.correct_attempts ?? selectedPerformance?.correctAttempts ?? 0

  return [
    {
      id: 'accuracy',
      label: 'Accuracy',
      value: formatRate(accuracyValue),
      helper: completed > 0 ? `${correctCount}/${completed} correct` : 'No attempts this week',
      icon: 'pi pi-chart-line',
      tone: accuracyValue >= 70 ? 'positive' : 'warning',
    },
    {
      id: 'attempts',
      label: 'Attempts',
      value: `${completed}`,
      helper: `Target ${target}/week`,
      icon: 'pi pi-check-square',
      tone: completed >= target ? 'positive' : 'neutral',
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
      label: rankLabel,
      value: options?.rankValue ?? defaultRankValue,
      helper: options?.rankHelper ?? defaultRankHelper,
      icon: 'pi pi-trophy',
      tone: options?.rankTone ?? defaultRankTone,
    },
  ]
}

/** buildOverviewInsights 的入参 */
interface BuildOverviewInsightsOptions {
  /** 当前展示对象名称（学科名或“all subjects”） */
  selectedSubjectLabel: string
  /** 当前统计周期数据 */
  selectedStatistics: StatisticsData | null
  /** 学科或标签维度表现列表（用于“当前重点”洞察） */
  subjectPerformances: SubjectPerformance[]
}

/**
 * 生成洞察建议列表。
 *
 * 输出策略：
 * - 峰值日：找本周期作答最多的一天；
 * - 挑战日：找本周期正确率最低（且有作答）的一天；
 * - 当前重点：找作答量最高的学科/标签；
 * - 若以上都无数据，返回“暂无数据”占位洞察。
 */
export const buildOverviewInsights = ({
  selectedSubjectLabel,
  selectedStatistics,
  subjectPerformances,
}: BuildOverviewInsightsOptions): OverviewInsight[] => {
  if (!selectedStatistics) {
    return []
  }

  const selectedDailyStatistics = selectedStatistics.daily_statistics
  // 按作答量降序，用于提取峰值日
  const sortedByAttempts = [...selectedDailyStatistics].sort(
    (left, right) => right.total_attempts - left.total_attempts,
  )
  // 按正确率升序，用于提取最具挑战的一天（仅统计有作答记录）
  const sortedByAccuracy = [...selectedDailyStatistics]
    .filter((entry) => entry.total_attempts > 0)
    .sort((left, right) => left.correct_rate - right.correct_rate)
  // 作答量最高的学科/标签，用于“当前重点”
  const topSubjectByAttempts = [...subjectPerformances].sort(
    (left, right) => right.totalAttempts - left.totalAttempts,
  )[0]

  // 按条件逐条追加洞察，保持固定展示顺序
  const insightsPayload: OverviewInsight[] = []

  // 峰值作答日
  if (sortedByAttempts[0]?.total_attempts > 0) {
    insightsPayload.push({
      id: 'peak-day',
      title: 'Peak Study Day',
      description: `${formatDateLabel(sortedByAttempts[0].date)} reached ${sortedByAttempts[0].total_attempts} attempts for ${selectedSubjectLabel}.`,
      icon: 'pi pi-bolt',
      tone: 'positive',
    })
  }

  // 正确率最低日（仅当存在作答数据）
  if (sortedByAccuracy[0]) {
    insightsPayload.push({
      id: 'weak-day',
      title: 'Most Challenging Day',
      description: `${formatDateLabel(sortedByAccuracy[0].date)} accuracy dropped to ${formatRate(sortedByAccuracy[0].correct_rate * 100)}. Consider a short review.`,
      icon: 'pi pi-exclamation-triangle',
      tone: 'warning',
    })
  }

  // 当前作答重心
  if (topSubjectByAttempts) {
    insightsPayload.push({
      id: 'focus-subject',
      title: 'Current Focus',
      description: `${topSubjectByAttempts.subject} has the highest workload (${topSubjectByAttempts.totalAttempts} attempts).`,
      icon: 'pi pi-compass',
      tone: 'neutral',
    })
  }

  // 若没有任何可生成洞察的数据，返回占位提示
  if (insightsPayload.length === 0) {
    insightsPayload.push({
      id: 'empty',
      title: 'No Attempts Yet',
      description: `Start practicing ${selectedSubjectLabel} to unlock trend insights and suggestions.`,
      icon: 'pi pi-lightbulb',
      tone: 'neutral',
    })
  }

  return insightsPayload
}
