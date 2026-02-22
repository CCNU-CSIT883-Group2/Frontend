import type {
  OverviewDashboardData,
  OverviewDailyData,
  OverviewInsightData,
  OverviewSubjectData,
} from '@/types'

const DEFAULT_SUBJECTS = ['Math', 'Physics', 'English', 'Computer Science'] as const
const WEEKLY_GOAL = 120

const PROFILE_BY_SUBJECT: Record<string, { attempts: number[]; accuracy: number[] }> = {
  Math: {
    attempts: [18, 22, 19, 24, 27, 23, 14],
    accuracy: [0.67, 0.72, 0.74, 0.76, 0.8, 0.78, 0.75],
  },
  Physics: {
    attempts: [10, 12, 14, 11, 16, 15, 8],
    accuracy: [0.58, 0.61, 0.64, 0.6, 0.67, 0.7, 0.63],
  },
  English: {
    attempts: [8, 9, 7, 12, 10, 9, 6],
    accuracy: [0.78, 0.82, 0.79, 0.85, 0.84, 0.81, 0.8],
  },
  'Computer Science': {
    attempts: [15, 17, 16, 19, 20, 18, 13],
    accuracy: [0.7, 0.73, 0.76, 0.78, 0.81, 0.79, 0.77],
  },
}

const toDateKey = (date: Date) => date.toISOString().slice(0, 10)

const getWeekRange = () => {
  const today = new Date()
  const start = new Date(today)
  const offset = (today.getDay() + 6) % 7
  start.setDate(today.getDate() - offset)
  start.setHours(0, 0, 0, 0)

  const dates = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start)
    current.setDate(start.getDate() + index)
    return current
  })

  return {
    dates,
    start: dates[0],
    end: dates[dates.length - 1],
    latest: new Date(today),
  }
}

const hashSeed = (value: string) =>
  value
    .split('')
    .map((char) => char.charCodeAt(0))
    .reduce((sum, item) => sum + item, 0)

const createProfileFromSeed = (seedValue: string) => {
  const seed = hashSeed(seedValue)

  const attempts = Array.from({ length: 7 }, (_, index) => 8 + ((seed + index * 9) % 14))
  const accuracy = Array.from({ length: 7 }, (_, index) => 0.58 + ((seed + index * 11) % 30) / 100)

  return { attempts, accuracy }
}

const getSubjectProfile = (subject: string) =>
  PROFILE_BY_SUBJECT[subject] ?? createProfileFromSeed(subject)

const buildDailyOverview = (subject: string): OverviewDailyData[] => {
  const profile = getSubjectProfile(subject)
  const { dates } = getWeekRange()

  return dates.map((date, index) => {
    const totalAttempts = profile.attempts[index]
    const accuracyRate = Number(profile.accuracy[index].toFixed(4))
    const correctAttempts = Math.round(totalAttempts * accuracyRate)

    return {
      date: toDateKey(date),
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      incorrect_attempts: Math.max(totalAttempts - correctAttempts, 0),
      accuracy_rate: accuracyRate,
    }
  })
}

const buildSubjectOverview = (subjects: string[]): OverviewSubjectData[] =>
  subjects.map((subject) => {
    const profile = getSubjectProfile(subject)

    const totalAttempts = profile.attempts.reduce((sum, value) => sum + value, 0)
    const correctAttempts = profile.attempts.reduce(
      (sum, value, index) => sum + Math.round(value * profile.accuracy[index]),
      0,
    )

    return {
      subject,
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      accuracy_rate: totalAttempts > 0 ? Number((correctAttempts / totalAttempts).toFixed(4)) : 0,
    }
  })

const calculateStreakDays = (dailyOverview: OverviewDailyData[]) => {
  let streak = 0

  for (let index = dailyOverview.length - 1; index >= 0; index -= 1) {
    if (dailyOverview[index].total_attempts > 0) {
      streak += 1
      continue
    }

    if (streak > 0) break
  }

  return streak
}

const buildInsights = (
  subject: string,
  dailyOverview: OverviewDailyData[],
): OverviewInsightData[] => {
  const peakDay = [...dailyOverview].sort(
    (left, right) => right.total_attempts - left.total_attempts,
  )[0]
  const weakestDay = [...dailyOverview]
    .filter((item) => item.total_attempts > 0)
    .sort((left, right) => left.accuracy_rate - right.accuracy_rate)[0]

  return [
    {
      id: 'peak-day',
      title: 'Peak Study Day',
      description: `${peakDay.date} reached ${peakDay.total_attempts} attempts with strong momentum.`,
      tone: 'positive',
    },
    {
      id: 'weak-day',
      title: 'Most Challenging Day',
      description: `${weakestDay.date} had the lowest accuracy (${(weakestDay.accuracy_rate * 100).toFixed(1)}%). Consider a short review.`,
      tone: 'warning',
    },
    {
      id: 'focus-subject',
      title: 'Current Focus',
      description: `${subject} is your focus subject this week. Keep this pace.`,
      tone: 'neutral',
    },
  ]
}

export function buildOverviewDashboardMockData(
  selectedSubject: string,
  subjectOptions: string[],
): OverviewDashboardData {
  const subjects = subjectOptions.length > 0 ? subjectOptions : [...DEFAULT_SUBJECTS]
  const focusSubject =
    selectedSubject && subjects.includes(selectedSubject) ? selectedSubject : subjects[0]

  const dailyOverview = buildDailyOverview(focusSubject)
  const subjectOverview = buildSubjectOverview(subjects)

  const totalAttempts = dailyOverview.reduce((sum, item) => sum + item.total_attempts, 0)
  const correctAttempts = dailyOverview.reduce((sum, item) => sum + item.correct_attempts, 0)
  const activeDays = dailyOverview.filter((item) => item.total_attempts > 0).length
  const streakDays = calculateStreakDays(dailyOverview)

  const rankedSubjects = [...subjectOverview]
    .filter((item) => item.total_attempts > 0)
    .sort((left, right) => right.accuracy_rate - left.accuracy_rate)

  const { start, end, latest } = getWeekRange()

  return {
    latest_time: latest.toISOString(),
    start_of_week: toDateKey(start),
    end_of_week: toDateKey(end),
    focus_subject: focusSubject,
    summary: {
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      accuracy_rate: totalAttempts > 0 ? Number((correctAttempts / totalAttempts).toFixed(4)) : 0,
      active_days: activeDays,
      streak_days: streakDays,
      weekly_goal: WEEKLY_GOAL,
      weekly_goal_progress: totalAttempts / WEEKLY_GOAL,
      subject_rank: rankedSubjects.findIndex((item) => item.subject === focusSubject) + 1,
      active_subject_count: rankedSubjects.length,
    },
    daily_overview: dailyOverview,
    subject_overview: subjectOverview,
    insights: buildInsights(focusSubject, dailyOverview),
  }
}
