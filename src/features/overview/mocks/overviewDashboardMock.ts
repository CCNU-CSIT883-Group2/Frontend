import type {
  OverviewDashboardData,
  OverviewDailyData,
  OverviewDailyTagData,
  OverviewDailyTagItemData,
  OverviewSubjectDashboardData,
  OverviewSubjectData,
  OverviewTagData,
} from '@/types'

const DEFAULT_SUBJECTS = ['Math', 'Physics', 'English', 'Computer Science'] as const
const DEFAULT_TAGS = ['Core Concepts', 'Practice', 'Review', 'Mock Exam'] as const
const WEEKLY_GOAL = 120

const TAGS_BY_SUBJECT: Record<string, readonly string[]> = {
  Math: ['Algebra', 'Calculus', 'Geometry', 'Probability'],
  Physics: ['Mechanics', 'Electromagnetism', 'Optics', 'Thermodynamics'],
  English: ['Reading', 'Vocabulary', 'Grammar', 'Writing'],
  'Computer Science': ['Networking', 'OS', 'Database', 'Algorithms'],
}

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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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

const getSubjectTags = (subject: string) => TAGS_BY_SUBJECT[subject] ?? DEFAULT_TAGS

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

const aggregateDailyOverview = (subjects: string[]): OverviewDailyData[] => {
  const { dates } = getWeekRange()
  const profiles = subjects.map((subject) => getSubjectProfile(subject))

  return dates.map((date, index) => {
    const totalAttempts = profiles.reduce((sum, profile) => sum + profile.attempts[index], 0)
    const correctAttempts = profiles.reduce(
      (sum, profile) => sum + Math.round(profile.attempts[index] * profile.accuracy[index]),
      0,
    )

    return {
      date: toDateKey(date),
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      incorrect_attempts: Math.max(totalAttempts - correctAttempts, 0),
      accuracy_rate: totalAttempts > 0 ? Number((correctAttempts / totalAttempts).toFixed(4)) : 0,
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

const rebalanceCorrectAttempts = (items: OverviewDailyTagItemData[], desiredCorrect: number) => {
  let diff = desiredCorrect - items.reduce((sum, item) => sum + item.correct_attempts, 0)
  if (diff === 0) return

  const sortedByCapacity =
    diff > 0
      ? [...items].sort(
          (left, right) =>
            right.total_attempts - right.correct_attempts - (left.total_attempts - left.correct_attempts),
        )
      : [...items].sort((left, right) => right.correct_attempts - left.correct_attempts)

  for (const item of sortedByCapacity) {
    if (diff === 0) break

    if (diff > 0) {
      const capacity = item.total_attempts - item.correct_attempts
      if (capacity <= 0) continue
      const delta = Math.min(capacity, diff)
      item.correct_attempts += delta
      item.incorrect_attempts = item.total_attempts - item.correct_attempts
      item.accuracy_rate =
        item.total_attempts > 0 ? Number((item.correct_attempts / item.total_attempts).toFixed(4)) : 0
      diff -= delta
      continue
    }

    const removable = item.correct_attempts
    if (removable <= 0) continue
    const delta = Math.min(removable, Math.abs(diff))
    item.correct_attempts -= delta
    item.incorrect_attempts = item.total_attempts - item.correct_attempts
    item.accuracy_rate =
      item.total_attempts > 0 ? Number((item.correct_attempts / item.total_attempts).toFixed(4)) : 0
    diff += delta
  }
}

const buildDailyTagOverview = (subject: string, dailyOverview: OverviewDailyData[]): OverviewDailyTagData[] => {
  const tags = getSubjectTags(subject)
  const stableWeights = tags.map((tag, index) => 3 + ((hashSeed(`${subject}:${tag}:${index}`) % 7)))
  const totalWeight = stableWeights.reduce((sum, item) => sum + item, 0)

  return dailyOverview.map((day) => {
    const attemptsByTag = tags.map((_, index) =>
      Math.floor((day.total_attempts * stableWeights[index]) / totalWeight),
    )
    let assignedAttempts = attemptsByTag.reduce((sum, item) => sum + item, 0)

    if (assignedAttempts < day.total_attempts) {
      const indexes = stableWeights
        .map((weight, index) => ({ weight, index }))
        .sort((left, right) => right.weight - left.weight)
        .map((item) => item.index)

      let pointer = 0
      while (assignedAttempts < day.total_attempts) {
        const index = indexes[pointer % indexes.length]
        attemptsByTag[index] += 1
        assignedAttempts += 1
        pointer += 1
      }
    }

    const items = tags.map((tag, index) => {
      const tagAttempts = attemptsByTag[index]
      const offset = ((hashSeed(`${tag}:${day.date}`) % 13) - 6) / 100
      const accuracyRate = clamp(day.accuracy_rate + offset, 0.35, 0.98)
      const correctAttempts = Math.round(tagAttempts * accuracyRate)

      return {
        tag,
        total_attempts: tagAttempts,
        correct_attempts: correctAttempts,
        incorrect_attempts: Math.max(tagAttempts - correctAttempts, 0),
        accuracy_rate: tagAttempts > 0 ? Number((correctAttempts / tagAttempts).toFixed(4)) : 0,
      }
    })

    rebalanceCorrectAttempts(items, day.correct_attempts)

    return {
      date: day.date,
      tags: items,
    }
  })
}

const buildTagOverview = (dailyTagOverview: OverviewDailyTagData[]): OverviewTagData[] => {
  const map = new Map<string, OverviewTagData>()

  dailyTagOverview.forEach((day) => {
    day.tags.forEach((tag) => {
      const previous = map.get(tag.tag)
      if (!previous) {
        map.set(tag.tag, {
          tag: tag.tag,
          total_attempts: tag.total_attempts,
          correct_attempts: tag.correct_attempts,
          incorrect_attempts: tag.incorrect_attempts,
          accuracy_rate: 0,
          active_days: tag.total_attempts > 0 ? 1 : 0,
        })
        return
      }

      previous.total_attempts += tag.total_attempts
      previous.correct_attempts += tag.correct_attempts
      previous.incorrect_attempts += tag.incorrect_attempts
      previous.active_days = (previous.active_days ?? 0) + (tag.total_attempts > 0 ? 1 : 0)
    })
  })

  return Array.from(map.values()).map((item) => ({
    ...item,
    accuracy_rate:
      item.total_attempts > 0 ? Number((item.correct_attempts / item.total_attempts).toFixed(4)) : 0,
  }))
}

export function buildOverviewDashboardMockData(subjectOptions: string[]): OverviewDashboardData {
  const subjects = subjectOptions.length > 0 ? subjectOptions : [...DEFAULT_SUBJECTS]
  const subjectOverview = buildSubjectOverview(subjects)
  const dailyOverview = aggregateDailyOverview(subjects)

  const totalAttempts = dailyOverview.reduce((sum, item) => sum + item.total_attempts, 0)
  const correctAttempts = dailyOverview.reduce((sum, item) => sum + item.correct_attempts, 0)
  const activeDays = dailyOverview.filter((item) => item.total_attempts > 0).length
  const streakDays = calculateStreakDays(dailyOverview)

  const rankedSubjects = [...subjectOverview]
    .filter((item) => item.total_attempts > 0)
    .sort((left, right) => right.accuracy_rate - left.accuracy_rate)
  const focusSubject = rankedSubjects[0]?.subject ?? subjects[0] ?? ''

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
    insights: [],
  }
}

export function buildOverviewSubjectDashboardMockData(
  subject: string,
  subjectOptions: string[],
): OverviewSubjectDashboardData {
  const subjects = subjectOptions.length > 0 ? subjectOptions : [...DEFAULT_SUBJECTS]
  const focusSubject = subject && subjects.includes(subject) ? subject : subjects[0]
  const dailyOverview = buildDailyOverview(focusSubject)
  const dailyTagOverview = buildDailyTagOverview(focusSubject, dailyOverview)
  const tagOverview = buildTagOverview(dailyTagOverview)

  const totalAttempts = dailyOverview.reduce((sum, item) => sum + item.total_attempts, 0)
  const correctAttempts = dailyOverview.reduce((sum, item) => sum + item.correct_attempts, 0)
  const activeDays = dailyOverview.filter((item) => item.total_attempts > 0).length
  const streakDays = calculateStreakDays(dailyOverview)

  const rankedTags = [...tagOverview]
    .filter((item) => item.total_attempts > 0)
    .sort((left, right) => right.accuracy_rate - left.accuracy_rate)
  const focusTag = [...tagOverview].sort((left, right) => right.total_attempts - left.total_attempts)[0]?.tag ?? ''

  const { start, end, latest } = getWeekRange()

  return {
    latest_time: latest.toISOString(),
    start_of_week: toDateKey(start),
    end_of_week: toDateKey(end),
    focus_subject: focusSubject,
    focus_tag: focusTag,
    summary: {
      total_attempts: totalAttempts,
      correct_attempts: correctAttempts,
      accuracy_rate: totalAttempts > 0 ? Number((correctAttempts / totalAttempts).toFixed(4)) : 0,
      active_days: activeDays,
      streak_days: streakDays,
      weekly_goal: WEEKLY_GOAL,
      weekly_goal_progress: totalAttempts / WEEKLY_GOAL,
      tag_count: rankedTags.length,
      tag_rank: rankedTags.findIndex((item) => item.tag === focusTag) + 1,
    },
    daily_overview: dailyOverview,
    tag_overview: tagOverview,
    daily_tag_overview: dailyTagOverview,
  }
}
