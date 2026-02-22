import axios from '@/axios'
import { streamQuestionCreation } from '@/services/questionCreationStream'
import { useUserSettingsStore, useUserStore } from '@/stores/user'
import type {
  CreateQuestionRequest,
  History,
  QuestionsCreateData,
  QuestionsCreateProgressState,
  QuestionsCreateStreamDonePayload,
  Response,
} from '@/types'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const modelCodeByName: Record<string, string> = {
  ChatGPT: 'C',
  Kimi: 'K',
}

export const useQuestionHistoryStore = defineStore('questionHistory', () => {
  const histories = ref<History[]>([])
  const isFetching = ref(false)

  const added = ref(false)
  const isStreaming = ref(false)
  const createError = ref<string | null>(null)
  const donePayload = ref<QuestionsCreateStreamDonePayload | null>(null)
  const createProgress = ref<QuestionsCreateProgressState>({
    total: 0,
    current: 0,
    percent: 0,
  })

  const subjects = computed(() => Array.from(new Set(histories.value.map((history) => history.subject))))
  const tags = computed(() => Array.from(new Set(histories.value.map((history) => history.tag))))

  const { name, token } = storeToRefs(useUserStore())
  const { settings } = storeToRefs(useUserSettingsStore())

  const resetCreateState = () => {
    createError.value = null
    donePayload.value = null
    createProgress.value = {
      total: 0,
      current: 0,
      percent: 0,
    }
  }

  const upsertHistory = (history: History) => {
    const existingIndex = histories.value.findIndex(
      (currentHistory) => currentHistory.history_id === history.history_id,
    )

    if (existingIndex >= 0) {
      histories.value[existingIndex] = history
      return
    }

    histories.value.push(history)
  }

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
    model: modelCodeByName[settings.value.questions.generate_model] ?? 'C',
  })

  const applyCreateDonePayload = (payload: QuestionsCreateStreamDonePayload) => {
    donePayload.value = payload
    upsertHistory(payload.history)
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

    applyCreateDonePayload({
      history: data.history[0],
      number: data.number,
      questions: data.questions,
      subject: data.subject,
      tag: data.tag,
      type: data.type,
    })
  }

  const fetch = async (): Promise<string | null> => {
    isFetching.value = true

    try {
      const response = await axios.get<Response<History[]>>('/history', {
        params: { username: name.value },
      })
      histories.value = response.data.data ?? []
      return null
    } catch (error) {
      return error instanceof Error
        ? error.message
        : 'Network error, please try again later.'
    } finally {
      isFetching.value = false
    }
  }

  const createWithStream = async (subject: string, tag: string, number: number, type: string) => {
    isFetching.value = true
    isStreaming.value = true
    added.value = false
    resetCreateState()

    const requestPayload = buildCreateRequest(subject, tag, number, type)

    try {
      await streamQuestionCreation({
        baseUrl: import.meta.env.VITE_SERVER_BASE_URL as string,
        token: token.value || localStorage.getItem('token') || '',
        payload: requestPayload,
        onStart: (payload) => {
          createProgress.value = {
            total: payload.total,
            current: 0,
            percent: 0,
          }
        },
        onProgress: (payload) => {
          createProgress.value = {
            total: payload.total,
            current: payload.current,
            percent: payload.percent,
          }
        },
        onDone: applyCreateDonePayload,
      })
      return
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

  const del = async (id: number): Promise<boolean> => {
    try {
      await axios.delete<Response<undefined>>('/history', {
        data: {
          username: name.value,
          history_id: id,
        },
      })

      histories.value = histories.value.filter((history) => history.history_id !== id)
      return true
    } catch {
      return false
    }
  }

  return {
    histories,
    subjects,
    tags,
    isFetching,
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
