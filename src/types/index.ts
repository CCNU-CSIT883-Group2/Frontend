export interface History {
  create_time: number
  history_id: number
  progress: number
  subject: string
  tag: string
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
  id: number
  content: string
  explanation: string
  difficulty: number
  time_required: number
  answer: number[]
  options: string[]
  note?: string
  type: string
}

export interface QuestionResponse {
  content: string
  correct_answers: number[]
  difficulty: number
  explanation: string
  history_id: number
  note?: string
  option1: string
  option2: string
  option3: string
  option4: string
  qid: number
  time_require: number
  type: string
}

export interface Response<T> {
  code: number
  info: string
  data: T
}
