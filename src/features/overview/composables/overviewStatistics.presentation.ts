import type { StatisticsData } from '@/types'
import {
  DEFAULT_WEEKLY_ATTEMPT_GOAL,
  calculateConsecutiveActiveDays,
  formatDateLabel,
  formatRate,
  normalizeRate,
  type SubjectPerformance,
} from '@/features/overview/composables/overviewStatistics.helpers'

export interface RankingSummary {
  total_attempts: number
  correct_attempts: number
  accuracy_rate: number
  weekly_goal: number
  weekly_goal_progress: number
  subject_rank?: number
  active_subject_count?: number
  tag_rank?: number
  tag_count?: number
}

export interface OverviewKpiCard {
  id: string
  label: string
  value: string
  helper: string
  icon: string
  tone: 'positive' | 'neutral' | 'warning'
}

export interface OverviewInsight {
  id: string
  title: string
  description: string
  icon: string
  tone: 'positive' | 'neutral' | 'warning'
}

interface BuildOverviewKpiOptions {
  selectedSubject: string
  subjectPerformances: SubjectPerformance[]
  selectedStatistics: StatisticsData | null
  summary?: RankingSummary
  options?: {
    rankLabel?: string
    rankUnitLabel?: string
    rankValue?: string
    rankHelper?: string
    rankTone?: OverviewKpiCard['tone']
  }
}

export const buildOverviewKpiCards = ({
  selectedSubject,
  subjectPerformances,
  selectedStatistics,
  summary,
  options,
}: BuildOverviewKpiOptions): OverviewKpiCard[] => {
  const selectedPerformance = subjectPerformances.find(
    (performance) => performance.subject === selectedSubject,
  )

  const practicedDays = selectedStatistics
    ? selectedStatistics.daily_statistics.filter((entry) => entry.total_attempts > 0).length
    : 0
  const totalDays = selectedStatistics?.daily_statistics.length ?? 0
  const streakDays = selectedStatistics
    ? calculateConsecutiveActiveDays(selectedStatistics.daily_statistics)
    : 0

  const rankedSubjects = [...subjectPerformances]
    .filter((entry) => entry.totalAttempts > 0)
    .sort((left, right) => right.accuracyRate - left.accuracyRate)

  const selectedRank =
    summary?.subject_rank ??
    summary?.tag_rank ??
    rankedSubjects.findIndex((entry) => entry.subject === selectedSubject) + 1
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

  const target = summary?.weekly_goal ?? DEFAULT_WEEKLY_ATTEMPT_GOAL
  const completed = summary?.total_attempts ?? selectedPerformance?.totalAttempts ?? 0

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

interface BuildOverviewInsightsOptions {
  selectedSubjectLabel: string
  selectedStatistics: StatisticsData | null
  subjectPerformances: SubjectPerformance[]
}

export const buildOverviewInsights = ({
  selectedSubjectLabel,
  selectedStatistics,
  subjectPerformances,
}: BuildOverviewInsightsOptions): OverviewInsight[] => {
  if (!selectedStatistics) {
    return []
  }

  const selectedDailyStatistics = selectedStatistics.daily_statistics
  const sortedByAttempts = [...selectedDailyStatistics].sort(
    (left, right) => right.total_attempts - left.total_attempts,
  )
  const sortedByAccuracy = [...selectedDailyStatistics]
    .filter((entry) => entry.total_attempts > 0)
    .sort((left, right) => left.correct_rate - right.correct_rate)
  const topSubjectByAttempts = [...subjectPerformances].sort(
    (left, right) => right.totalAttempts - left.totalAttempts,
  )[0]

  const insightsPayload: OverviewInsight[] = []

  if (sortedByAttempts[0]?.total_attempts > 0) {
    insightsPayload.push({
      id: 'peak-day',
      title: 'Peak Study Day',
      description: `${formatDateLabel(sortedByAttempts[0].date)} reached ${sortedByAttempts[0].total_attempts} attempts for ${selectedSubjectLabel}.`,
      icon: 'pi pi-bolt',
      tone: 'positive',
    })
  }

  if (sortedByAccuracy[0]) {
    insightsPayload.push({
      id: 'weak-day',
      title: 'Most Challenging Day',
      description: `${formatDateLabel(sortedByAccuracy[0].date)} accuracy dropped to ${formatRate(sortedByAccuracy[0].correct_rate * 100)}. Consider a short review.`,
      icon: 'pi pi-exclamation-triangle',
      tone: 'warning',
    })
  }

  if (topSubjectByAttempts) {
    insightsPayload.push({
      id: 'focus-subject',
      title: 'Current Focus',
      description: `${topSubjectByAttempts.subject} has the highest workload (${topSubjectByAttempts.totalAttempts} attempts).`,
      icon: 'pi pi-compass',
      tone: 'neutral',
    })
  }

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
