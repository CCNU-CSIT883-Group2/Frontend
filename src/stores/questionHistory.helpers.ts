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

/** 题目创建进度的初始（归零）状态 */
export const DEFAULT_CREATE_PROGRESS: QuestionsCreateProgressState = {
  total: 0,
  current: 0,
  percent: 0,
}

/** buildCreateRequestPayload 的入参结构 */
interface BuildCreateRequestOptions {
  subject: string
  tag: string
  number: number
  type: string
  model: string
}

/**
 * 将前端表单数据组装为发送给后端 /questions/create 接口的请求体。
 * model 为空时回退到默认模型代码 'C'。
 */
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

/**
 * 在题单列表中插入或更新一条 History 记录（按 history_id 匹配）。
 * - 找到已有记录：原地替换；
 * - 未找到：追加到末尾。
 * 返回新数组，不修改原数组（保持 shallowRef 的响应性）。
 */
export const upsertHistoryItem = (histories: History[], history: History) => {
  const existingIndex = histories.findIndex((currentHistory) => currentHistory.history_id === history.history_id)
  if (existingIndex < 0) {
    return [...histories, history]
  }

  const nextHistories = [...histories]
  nextHistories[existingIndex] = history
  return nextHistories
}

/**
 * 将普通 HTTP 接口（/questions/create）返回的 QuestionsCreateData
 * 转换为与流式接口相同格式的 QuestionsCreateStreamDonePayload。
 * 若数据缺少 history 则抛出异常，由调用方统一处理错误。
 */
export const toDonePayloadFromCreateData = (
  data: QuestionsCreateData | null | undefined,
): QuestionsCreateStreamDonePayload => {
  if (!data?.history?.length) {
    throw new Error('No history returned from /questions/create')
  }
  const firstHistory = data.history[0]
  if (!firstHistory) {
    throw new Error('No history returned from /questions/create')
  }

  return {
    history: firstHistory,
    number: data.number,
    questions: data.questions,
    subject: data.subject,
    tag: data.tag,
    type: data.type,
  }
}

/**
 * 更新题单列表中指定 history_id 的完成进度（progress）。
 * - progress 会被夹在 [0, 1] 范围内；
 * - 未找到对应记录时直接返回原数组，避免无效渲染；
 * - 返回新数组，保持 shallowRef 响应性。
 */
export const updateHistoryProgressState = (
  histories: History[],
  historyId: number,
  progress: number,
) => {
  const existingIndex = histories.findIndex((history) => history.history_id === historyId)
  if (existingIndex < 0) return histories

  // 将 progress 限制在合法范围 [0, 1]
  const normalizedProgress = Math.min(1, Math.max(0, progress))
  const nextHistories = [...histories]
  const currentHistory = nextHistories[existingIndex]
  if (!currentHistory) return histories
  nextHistories[existingIndex] = {
    ...currentHistory,
    progress: normalizedProgress,
  }
  return nextHistories
}
