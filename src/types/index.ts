export interface History {
  create_time: number
  history_id: number
  progress: number
  subject: string
  tag: string
  user_id: string
}

export interface HistoryFilter {
  subject?: string
  tag?: string
  content: string[]
  status: ProgressStatus
}

export enum ProgressStatus {
  InProgress = 'In Progress',
  Finished = 'Finished',
  All = 'All',
}

export interface Question {
  history_id: number
  question_id: number
  content: string
  explanation: string
  difficulty: number
  time_require: number
  correct_answers: number[]
  options: string[]
  note?: string | null
  type: string
}

export interface QuestionsCreateData {
  subject: string
  tag: string
  type: string
  questions: Question[]
  history: History[]
  number: number
}

export interface AttemptPostData {
  attempt: {
    history_id: number
    question_id: number
    is_correct: boolean
  }
}

export interface Attempt {
  user_answers: number[]
  question_id: number
  history_id: number
  attempt_id: number
  attempt_time: string
  is_correct: boolean
  user_id: string
}

export interface User {
  user_id: string
  name: string
  password: string
  email: string
  role: string
  models?: string[]
}

export interface LoginData {
  token: string
  user: User
  models?: string[]
}

export interface RegisterResponse {
  code: number
  info: string
  user: User
}

export interface ProfileUpdateRequest {
  new_name: string | null
  new_email: string | null
  new_password: string | null
  new_weekly_goal?: number | null
}

export interface DailyStatistics {
  date: string
  total_attempts: number
  correct_attempts: number
  correct_rate: number
  questions_on_date: number[]
}

export interface StatisticsData {
  latest_time: string
  start_of_week: string
  end_of_week: string
  daily_statistics: DailyStatistics[]
}

export type OverviewInsightTone = 'positive' | 'neutral' | 'warning'

export interface OverviewSummaryData {
  total_attempts: number
  correct_attempts: number
  accuracy_rate: number
  active_days: number
  streak_days: number
  weekly_goal: number
  weekly_goal_progress: number
  subject_rank: number
  active_subject_count: number
}

export interface OverviewDailyData {
  date: string
  total_attempts: number
  correct_attempts: number
  incorrect_attempts: number
  accuracy_rate: number
}

export interface OverviewSubjectData {
  subject: string
  total_attempts: number
  correct_attempts: number
  accuracy_rate: number
}

export interface OverviewInsightData {
  id: string
  title: string
  description: string
  tone: OverviewInsightTone
}

export interface OverviewDashboardData {
  latest_time: string
  start_of_week: string
  end_of_week: string
  focus_subject: string
  summary: OverviewSummaryData
  daily_overview: OverviewDailyData[]
  subject_overview: OverviewSubjectData[]
  insights?: OverviewInsightData[]
}

export interface OverviewTagData {
  tag: string
  total_attempts: number
  correct_attempts: number
  incorrect_attempts: number
  accuracy_rate: number
  active_days: number
}

export interface OverviewDailyTagItemData {
  tag: string
  total_attempts: number
  correct_attempts: number
  incorrect_attempts: number
  accuracy_rate: number
}

export interface OverviewDailyTagData {
  date: string
  tags: OverviewDailyTagItemData[]
}

export interface OverviewSubjectSummaryData {
  total_attempts: number
  correct_attempts: number
  accuracy_rate: number
  active_days: number
  streak_days: number
  weekly_goal: number
  weekly_goal_progress: number
  tag_count: number
  tag_rank: number
}

export interface OverviewSubjectDashboardData {
  latest_time: string
  start_of_week: string
  end_of_week: string
  focus_subject: string
  focus_tag: string
  summary: OverviewSubjectSummaryData
  daily_overview: OverviewDailyData[]
  tag_overview: OverviewTagData[]
  daily_tag_overview: OverviewDailyTagData[]
}

export interface ProfileTrendDailyData {
  date: string
  total_attempts: number
  correct_attempts: number
  incorrect_attempts?: number
}

export interface ProfileTrendData {
  latest_time: string
  start_date: string
  end_date: string
  daily_trend: ProfileTrendDailyData[]
}

export interface CreateQuestionRequest {
  subject: string
  tag: string
  type: string
  number: number
  model: string
}

export interface QuestionsCreateStreamStart {
  total: number
}

export interface QuestionsCreateStreamProgress {
  current: number
  percent: number
  total: number
}

export interface QuestionsCreateStreamDonePayload {
  history: History
  number: number
  questions: Question[]
  subject: string
  tag: string
  type: string
}

export interface QuestionsCreateProgressState {
  total: number
  current: number
  percent: number
}

export interface Response<T> {
  code: number
  info: string
  data: T
}
