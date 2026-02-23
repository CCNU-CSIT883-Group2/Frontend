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

/** SSE 协议中支持的事件类型；未知类型统一归为 'message' */
type StreamEventName = 'start' | 'progress' | 'done' | 'message'

/** 解析单个 SSE 数据块后的结构 */
interface ParsedSseEvent {
  eventName: StreamEventName
  /** 已反序列化的 payload（JSON 对象或原始字符串） */
  payload: unknown
}

/** streamQuestionCreation 函数的入参 */
interface StreamQuestionCreationOptions {
  /** 后端服务根地址，不含末尾斜杠 */
  baseUrl: string
  /** 当前用户 token，用于请求头鉴权 */
  token: string
  /** 发送给后端的出题参数 */
  payload: CreateQuestionRequest
  /** 可选的 AbortSignal，用于外部取消流式请求 */
  signal?: AbortSignal
  /** 收到 start 事件时的回调（含题目总数） */
  onStart?: (payload: QuestionsCreateStreamStart) => void
  /** 收到 progress 事件时的回调（含 current/percent/total） */
  onProgress?: (payload: QuestionsCreateStreamProgress) => void
  /** 收到 done 事件时的回调（含完整题目列表和 history） */
  onDone?: (payload: QuestionsCreateStreamDonePayload) => void
}

/** 类型守卫：判断值是否为非 null 的普通对象 */
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

/**
 * 将字符串解析为合法的 StreamEventName。
 * 仅允许 'start' | 'progress' | 'done'，其余一律视为通用 'message'。
 */
const parseStreamEventName = (value: string): StreamEventName => {
  if (value === 'start' || value === 'progress' || value === 'done') {
    return value
  }

  return 'message'
}

/**
 * 解析一个完整的 SSE 数据块（两个换行符之间的文本）。
 *
 * SSE 格式示例：
 * ```
 * event: progress
 * data: {"current":1,"percent":20,"total":5}
 * ```
 *
 * 返回 null 表示该块不含有效数据（例如注释行或空块）。
 */
function parseSseBlock(block: string): ParsedSseEvent | null {
  const lines = block.split('\n')
  let eventName: StreamEventName = 'message'
  const dataLines: string[] = []

  for (const line of lines) {
    const normalized = line.trimEnd()
    if (!normalized) continue

    if (normalized.startsWith('event:')) {
      // 提取 "event:" 后的事件名并规范化
      eventName = parseStreamEventName(normalized.slice(6).trim())
      continue
    }

    if (normalized.startsWith('data:')) {
      // 提取 "data:" 后的数据行
      dataLines.push(normalized.slice(5).trim())
    }
  }

  if (dataLines.length === 0) return null
  // SSE 允许同一个 event 使用多行 data，按协议需要拼回完整 payload。
  const raw = dataLines.join('\n')

  try {
    return { eventName, payload: JSON.parse(raw) as unknown }
  } catch {
    // JSON 解析失败时以原始字符串返回，调用方可根据类型守卫过滤
    return { eventName, payload: raw as unknown }
  }
}

/** 类型守卫：校验 payload 是否符合 start 事件结构 */
const isStartPayload = (payload: unknown): payload is QuestionsCreateStreamStart => {
  if (!isObject(payload)) return false
  return typeof payload.total === 'number'
}

/** 类型守卫：校验 payload 是否符合 progress 事件结构 */
const isProgressPayload = (payload: unknown): payload is QuestionsCreateStreamProgress => {
  if (!isObject(payload)) return false
  return (
    typeof payload.current === 'number' &&
    typeof payload.percent === 'number' &&
    typeof payload.total === 'number'
  )
}

/** 类型守卫：校验 payload 是否符合 done 事件结构 */
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

/**
 * 通过 Fetch + ReadableStream 消费后端 SSE 流式出题接口。
 *
 * 工作流程：
 * 1. 发送 POST 请求，要求响应为 text/event-stream；
 * 2. 逐块读取响应体，按 "\n\n" 分隔符拆分 SSE 事件块；
 * 3. 解析每个块并派发到对应回调（onStart / onProgress / onDone）；
 * 4. 若读取完毕但未收到合法 done 事件，抛出异常（供调用方降级处理）。
 *
 * @throws 请求失败、响应体为空、或流结束前未收到 done 事件时抛出 Error
 */
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

  // 仅在有 token 时注入鉴权头，公共端点无需携带
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
    // 非 2xx 状态码时读取响应体作为错误信息
    const message = await response.text()
    throw new Error(message || `Stream API failed with status ${response.status}`)
  }

  if (!response.body) {
    throw new Error('Stream API returned an empty response body')
  }

  // 获取流读取器和文本解码器（stream: true 支持多字节字符跨块解码）
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  /** 是否已收到合法的 done 事件，用于最终完整性校验 */
  let streamDone = false

  /**
   * 处理单个完整 SSE 事件块：解析后根据事件类型派发到对应回调。
   * 类型不匹配时静默丢弃，避免中断整个读取循环。
   */
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

  // 主读取循环：持续从流中读取二进制块，解码后追加到 buffer，
  // 按 "\n\n" 分隔符逐块提取并处理 SSE 事件。
  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    // decode 的 stream:true 选项让解码器正确处理块边界的多字节字符
    buffer += decoder.decode(value, { stream: true })

    // 按 SSE 协议以 "\n\n" 为事件块分隔符提取完整块
    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary).replace(/\r/g, '') // 统一换行符
      buffer = buffer.slice(boundary + 2)
      processBlock(block)
      boundary = buffer.indexOf('\n\n')
    }
  }

  // SSE can finish without a trailing separator, so handle the remaining chunk.
  // 流结束后 buffer 中可能还有未以 "\n\n" 结尾的最后一块
  const tail = buffer.trim().replace(/\r/g, '')
  if (tail) {
    processBlock(tail)
  }

  if (!streamDone) {
    // 后端提前断流时显式失败，避免上层误判为成功创建。
    throw new Error('Stream ended before receiving done event')
  }
}
