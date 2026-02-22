import type {
  CreateQuestionRequest,
  QuestionsCreateStreamDonePayload,
  QuestionsCreateStreamProgress,
  QuestionsCreateStreamStart,
} from '@/types'

interface ParsedSseEvent {
  eventName: string
  payload: unknown
}

interface StreamQuestionCreationOptions {
  baseUrl: string
  token: string
  payload: CreateQuestionRequest
  onStart?: (payload: QuestionsCreateStreamStart) => void
  onProgress?: (payload: QuestionsCreateStreamProgress) => void
  onDone?: (payload: QuestionsCreateStreamDonePayload) => void
}

function parseSseBlock(block: string): ParsedSseEvent | null {
  const lines = block.split('\n')
  let eventName = 'message'
  const dataLines: string[] = []

  for (const line of lines) {
    const normalized = line.trimEnd()
    if (!normalized) continue

    if (normalized.startsWith('event:')) {
      eventName = normalized.slice(6).trim()
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

export async function streamQuestionCreation({
  baseUrl,
  token,
  payload,
  onStart,
  onProgress,
  onDone,
}: StreamQuestionCreationOptions) {
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

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary).replace(/\r/g, '')
      buffer = buffer.slice(boundary + 2)

      const event = parseSseBlock(block)
      if (!event) {
        boundary = buffer.indexOf('\n\n')
        continue
      }

      if (event.eventName === 'start') {
        onStart?.(event.payload as QuestionsCreateStreamStart)
      }

      if (event.eventName === 'progress') {
        onProgress?.(event.payload as QuestionsCreateStreamProgress)
      }

      if (event.eventName === 'done') {
        onDone?.(event.payload as QuestionsCreateStreamDonePayload)
        streamDone = true
      }

      boundary = buffer.indexOf('\n\n')
    }
  }

  if (!streamDone) {
    throw new Error('Stream ended before receiving done event')
  }
}
