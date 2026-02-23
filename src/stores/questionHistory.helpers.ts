/**
 * 文件说明（是什么）：
 * - 本文件是「Store 辅助函数模块」。
 * - 提供 Store 所需的纯函数与转换逻辑（模块：questionHistory.helpers）。
 *
 * 设计原因（为什么）：
 * - 把可复用计算从状态容器中拆分，降低耦合并提升可测试性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type {
  CreateQuestionRequest,
  History,
  QuestionsCreateData,
  QuestionsCreateProgressState,
  QuestionsCreateStreamDonePayload,
} from '@/types'

export const DEFAULT_CREATE_PROGRESS: QuestionsCreateProgressState = {
  total: 0,
  current: 0,
  percent: 0,
}

interface BuildCreateRequestOptions {
  subject: string
  tag: string
  number: number
  type: string
  model: string
}

export const buildCreateRequestPayload = ({
  subject,
  tag,
  number,
  type,
  model,
}: BuildCreateRequestOptions): CreateQuestionRequest => ({
  subject,
  tag,
  number,
  type,
  model: model || 'C',
})

export const upsertHistoryItem = (histories: History[], history: History) => {
  const existingIndex = histories.findIndex((currentHistory) => currentHistory.history_id === history.history_id)
  if (existingIndex < 0) {
    return [...histories, history]
  }

  const nextHistories = [...histories]
  nextHistories[existingIndex] = history
  return nextHistories
}

export const toDonePayloadFromCreateData = (
  data: QuestionsCreateData | null | undefined,
): QuestionsCreateStreamDonePayload => {
  if (!data?.history?.length) {
    throw new Error('No history returned from /questions/create')
  }

  return {
    history: data.history[0],
    number: data.number,
    questions: data.questions,
    subject: data.subject,
    tag: data.tag,
    type: data.type,
  }
}

export const updateHistoryProgressState = (
  histories: History[],
  historyId: number,
  progress: number,
) => {
  const existingIndex = histories.findIndex((history) => history.history_id === historyId)
  if (existingIndex < 0) return histories

  const normalizedProgress = Math.min(1, Math.max(0, progress))
  const nextHistories = [...histories]
  nextHistories[existingIndex] = {
    ...nextHistories[existingIndex],
    progress: normalizedProgress,
  }
  return nextHistories
}
