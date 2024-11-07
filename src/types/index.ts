export interface History {
  subject: string
  tag: string
  createAt: Date
  progress: number
}

export interface HistoryFilter {
  subject?: string
  tag?: string
  content: string[]
  status: ProgressStatus
}

export enum ProgressStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Finished = 'Finished',
  All = 'All',
}
