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
    throw new Error('Stream ended before receiving done event')
  }
}
