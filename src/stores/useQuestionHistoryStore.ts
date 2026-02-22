import axios from '@/axios'
import type {
  CreateQuestionRequest,
  History,
  QuestionsCreateData,
  QuestionsCreateProgressState,
  QuestionsCreateStreamDonePayload,
  QuestionsCreateStreamProgress,
  QuestionsCreateStreamStart,
  Response,
} from '@/types'
import { useUserSettingsStore, useUserStore } from '@/stores/user'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

function parseSseBlock(block: string) {
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

export const useQuestionHistoryStore = defineStore('QuestionHistory', () => {
  const histories = ref<History[]>([])
  const subjects = computed(() => Array.from(new Set(histories.value.map((h) => h.subject))))
  const tags = computed(() => Array.from(new Set(histories.value.map((h) => h.tag))))

  const { name, token } = storeToRefs(useUserStore())

  const isFetching = ref(false)

  const fetch = () => {
    isFetching.value = true
    const error = ref<string | null>(null)

    axios
      .get<Response<History[]>>('/history', {
        params: { username: name.value },
      })
      .then((response) => {
        histories.value = response.data.data ?? []
      })
      .catch(() => {
        error.value = 'Network error, please try again later.'
      })
      .finally(() => {
        isFetching.value = false
      })

    return error
  }

  const added = ref(false)
  const isStreaming = ref(false)
  const createError = ref<string | null>(null)
  const donePayload = ref<QuestionsCreateStreamDonePayload | null>(null)
  const createProgress = ref<QuestionsCreateProgressState>({
    total: 0,
    current: 0,
    percent: 0,
  })

  const resetCreateState = () => {
    createError.value = null
    donePayload.value = null
    createProgress.value = {
      total: 0,
      current: 0,
      percent: 0,
    }
  }

  const { settings } = storeToRefs(useUserSettingsStore())

  const modelMap = new Map([
    ['ChatGPT', 'C'],
    ['Kimi', 'K'],
  ])

  const buildCreateRequest = (
    subject: string,
    tag: string,
    number: number,
    type: string,
  ): CreateQuestionRequest => ({
    name: name.value,
    subject,
    tag,
    number,
    type,
    model: modelMap.get(settings.value.questions.generate_model) ?? 'C',
  })

  const applyCreateDonePayload = (payload: QuestionsCreateStreamDonePayload) => {
    donePayload.value = payload
    histories.value.push(payload.history)
    createProgress.value = {
      total: payload.number,
      current: payload.number,
      percent: 100,
    }
    added.value = true
  }

  const createWithFallback = async (requestPayload: CreateQuestionRequest) => {
    const response = await axios.post<Response<QuestionsCreateData>>('/questions/create', requestPayload)
    const data = response.data.data

    if (!data?.history?.length) {
      throw new Error('No history returned from /questions/create')
    }

    const history = data.history[0]
    applyCreateDonePayload({
      history,
      number: data.number,
      questions: data.questions,
      subject: data.subject,
      tag: data.tag,
      type: data.type,
    })
  }

  const createWithStream = async (subject: string, tag: string, number: number, type: string) => {
    isFetching.value = true
    isStreaming.value = true
    added.value = false
    resetCreateState()

    const requestPayload = buildCreateRequest(subject, tag, number, type)

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      }

      const authToken = token.value || localStorage.getItem('token') || ''
      if (authToken) {
        headers.AUTHORIZATION = authToken
      }

      const response = await window.fetch(
        `${import.meta.env.VITE_SERVER_BASE_URL as string}/questions/create/stream`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestPayload),
        },
      )

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

          const parsed = parseSseBlock(block)
          if (!parsed) {
            boundary = buffer.indexOf('\n\n')
            continue
          }

          if (parsed.eventName === 'start') {
            const payload = parsed.payload as QuestionsCreateStreamStart
            createProgress.value = {
              total: payload.total,
              current: 0,
              percent: 0,
            }
          }

          if (parsed.eventName === 'progress') {
            const payload = parsed.payload as QuestionsCreateStreamProgress
            createProgress.value = {
              total: payload.total,
              current: payload.current,
              percent: payload.percent,
            }
          }

          if (parsed.eventName === 'done') {
            const payload = parsed.payload as QuestionsCreateStreamDonePayload
            applyCreateDonePayload(payload)
            streamDone = true
          }

          boundary = buffer.indexOf('\n\n')
        }
      }

      if (!streamDone) {
        throw new Error('Stream ended before receiving done event')
      }
    } catch (streamError) {
      try {
        await createWithFallback(requestPayload)
      } catch (fallbackError) {
        createError.value =
          fallbackError instanceof Error
            ? fallbackError.message
            : streamError instanceof Error
              ? streamError.message
              : 'Failed to create new questions.'
      }
    } finally {
      isStreaming.value = false
      isFetching.value = false
    }
  }

  const del = (id: number) => {
    axios
      .delete<Response<undefined>>('/history', { data: { username: name.value, history_id: id } })
      .then(() => {
        histories.value = histories.value.filter((h) => h.history_id !== id)
      })
  }

  return {
    histories,
    subjects,
    tags,
    added,
    isStreaming,
    createError,
    donePayload,
    createProgress,
    fetch,
    createWithStream,
    del,
  }
})
