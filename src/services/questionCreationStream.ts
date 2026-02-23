/**
 * 文件说明（是什么）：
 * - 本文件是「服务层模块」。
 * - 封装题目创建相关的流式请求与数据处理逻辑。
 *
 * 设计原因（为什么）：
 * - 把异步通信细节隔离在服务层，减轻组件与状态层复杂度。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type {
  CreateQuestionRequest,
  QuestionsCreateStreamDonePayload,
  QuestionsCreateStreamProgress,
  QuestionsCreateStreamStart,
} from '@/types'

type StreamEventName = 'start' | 'progress' | 'done' | 'message'

interface ParsedSseEvent {
  eventName: StreamEventName
  payload: unknown
}

interface StreamQuestionCreationOptions {
  baseUrl: string
  token: string
  payload: CreateQuestionRequest
  signal?: AbortSignal
  onStart?: (payload: QuestionsCreateStreamStart) => void
  onProgress?: (payload: QuestionsCreateStreamProgress) => void
  onDone?: (payload: QuestionsCreateStreamDonePayload) => void
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseStreamEventName = (value: string): StreamEventName => {
  if (value === 'start' || value === 'progress' || value === 'done') {
    return value
  }

  return 'message'
}

function parseSseBlock(block: string): ParsedSseEvent | null {
  const lines = block.split('\n')
  let eventName: StreamEventName = 'message'
  const dataLines: string[] = []

  for (const line of lines) {
    const normalized = line.trimEnd()
    if (!normalized) continue

    if (normalized.startsWith('event:')) {
      eventName = parseStreamEventName(normalized.slice(6).trim())
      continue
    }

    if (normalized.startsWith('data:')) {
      dataLines.push(normalized.slice(5).trim())
    }
  }

  if (dataLines.length === 0) return null
  // SSE 允许同一个 event 使用多行 data，按协议需要拼回完整 payload。
  const raw = dataLines.join('\n')

  try {
    return { eventName, payload: JSON.parse(raw) as unknown }
  } catch {
    return { eventName, payload: raw as unknown }
  }
}

const isStartPayload = (payload: unknown): payload is QuestionsCreateStreamStart => {
  if (!isObject(payload)) return false
  return typeof payload.total === 'number'
}

const isProgressPayload = (payload: unknown): payload is QuestionsCreateStreamProgress => {
  if (!isObject(payload)) return false
  return (
    typeof payload.current === 'number' &&
    typeof payload.percent === 'number' &&
    typeof payload.total === 'number'
  )
}

const isDonePayload = (payload: unknown): payload is QuestionsCreateStreamDonePayload => {
  if (!isObject(payload)) return false

  // done 事件结构不完整时不抛错，交给调用方根据 streamDone 判断兜底。
  return (
    isObject(payload.history) &&
    typeof payload.number === 'number' &&
    Array.isArray(payload.questions) &&
    typeof payload.subject === 'string' &&
    typeof payload.tag === 'string' &&
    typeof payload.type === 'string'
  )
}

export async function streamQuestionCreation({
  baseUrl,
  token,
  payload,
  signal,
  onStart,
  onProgress,
  onDone,
}: StreamQuestionCreationOptions): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  }

  if (token) {
    headers.AUTHORIZATION = token
  }

  const response = await window.fetch(`${baseUrl}/questions/create/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Stream API failed with status ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Stream API returned an empty response body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let streamDone = false

  const processBlock = (block: string) => {
    const event = parseSseBlock(block)
    if (!event) return

    if (event.eventName === 'start') {
      if (isStartPayload(event.payload)) {
        onStart?.(event.payload)
      }
      return
    }

    if (event.eventName === 'progress') {
      if (isProgressPayload(event.payload)) {
        onProgress?.(event.payload)
      }
      return
    }

    if (event.eventName === 'done' && isDonePayload(event.payload)) {
      onDone?.(event.payload)
      // 只有收到合法 done 事件才视为流正常结束。
      streamDone = true
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary).replace(/\r/g, '')
      buffer = buffer.slice(boundary + 2)
      processBlock(block)
      boundary = buffer.indexOf('\n\n')
    }
  }

  // SSE can finish without a trailing separator, so handle the remaining chunk.
  const tail = buffer.trim().replace(/\r/g, '')
  if (tail) {
    processBlock(tail)
  }

  if (!streamDone) {
    // 后端提前断流时显式失败，避免上层误判为成功创建。
    throw new Error('Stream ended before receiving done event')
  }
}
