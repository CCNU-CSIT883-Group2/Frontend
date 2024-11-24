export interface History {
  history_id: number
  subject: string
  tag: string
  create_time: Date
  progress: number
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
  answer: number
  options: string[]
  note?: string
  type: string
}

export interface Response<T> {
  code: number
  info: string
  data: T
}
