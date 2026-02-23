import axios from '@/axios'
import { API_BASE_URL } from '@/config'
import { streamQuestionCreation } from '@/services/questionCreationStream'
import { useUserSettingsStore, useUserStore } from '@/stores/userStore'
import type {
  CreateQuestionRequest,
  History,
  QuestionsCreateData,
  QuestionsCreateProgressState,
  QuestionsCreateStreamDonePayload,
  Response,
} from '@/types'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

const DEFAULT_PROGRESS: QuestionsCreateProgressState = {
  total: 0,
  current: 0,
  percent: 0,
}

export const useQuestionHistoryStore = defineStore('questionHistory', () => {
  const histories = shallowRef<History[]>([])
  const isFetching = ref(false)

  const hasCreatedHistory = ref(false)
  const latestCreatedHistoryId = shallowRef<number | null>(null)
  const isStreaming = ref(false)
  const createError = ref<string | null>(null)
  const donePayload = shallowRef<QuestionsCreateStreamDonePayload | null>(null)
  const createProgress = shallowRef<QuestionsCreateProgressState>({ ...DEFAULT_PROGRESS })

  const subjects = computed(() =>
    Array.from(new Set(histories.value.map((history) => history.subject))).sort(),
  )
  const tags = computed(() =>
    Array.from(new Set(histories.value.map((history) => history.tag))).sort(),
  )

  const { token } = storeToRefs(useUserStore())
  const { settings } = storeToRefs(useUserSettingsStore())

  const setCreateProgress = (patch: Partial<QuestionsCreateProgressState>) => {
    createProgress.value = { ...createProgress.value, ...patch }
  }

  const resetCreateState = () => {
    createError.value = null
    donePayload.value = null
    createProgress.value = { ...DEFAULT_PROGRESS }
  }

  const markHistoryCreated = (historyId: number) => {
    latestCreatedHistoryId.value = historyId
    hasCreatedHistory.value = true
  }

  const clearCreatedHistoryState = () => {
    hasCreatedHistory.value = false
    latestCreatedHistoryId.value = null
  }

  const upsertHistory = (history: History) => {
    const existingIndex = histories.value.findIndex(
      (currentHistory) => currentHistory.history_id === history.history_id,
    )

    if (existingIndex >= 0) {
      const nextHistories = [...histories.value]
      nextHistories[existingIndex] = history
      histories.value = nextHistories
      return
    }

    histories.value = [...histories.value, history]
  }

  const buildCreateRequest = (
    subject: string,
    tag: string,
    number: number,
    type: string,
  ): CreateQuestionRequest => ({
    subject,
    tag,
    number,
    type,
    model: settings.value.questions.generateModel || 'C',
  })

  const applyCreateDonePayload = (payload: QuestionsCreateStreamDonePayload) => {
    donePayload.value = payload
    upsertHistory(payload.history)
    createProgress.value = {
      total: payload.number,
      current: payload.number,
      percent: 100,
    }
    markHistoryCreated(payload.history.history_id)
  }

  const createWithFallback = async (requestPayload: CreateQuestionRequest) => {
    const response = await axios.post<Response<QuestionsCreateData>>(
      '/questions/create',
      requestPayload,
    )
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

  const fetchHistories = async (): Promise<string | null> => {
    isFetching.value = true

    try {
      const response = await axios.get<Response<History[]>>('/history')
      histories.value = response.data.data ?? []
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Network error, please try again later.'
    } finally {
      isFetching.value = false
    }
  }

  const createQuestions = async (subject: string, tag: string, number: number, type: string) => {
    isFetching.value = true
    isStreaming.value = true
    clearCreatedHistoryState()
    resetCreateState()

    const requestPayload = buildCreateRequest(subject, tag, number, type)

    try {
      await streamQuestionCreation({
        baseUrl: API_BASE_URL,
        token: token.value || '',
        payload: requestPayload,
        onStart: (payload) => {
          createProgress.value = {
            total: payload.total,
            current: 0,
            percent: 0,
          }
        },
        onProgress: (payload) => {
          setCreateProgress({
            total: payload.total,
            current: payload.current,
            percent: payload.percent,
          })
        },
        onDone: applyCreateDonePayload,
      })
      return
    } catch (streamError) {
      try {
        await createWithFallback(requestPayload)
      } catch (fallbackError) {
        createProgress.value = { ...DEFAULT_PROGRESS }
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

  const deleteHistory = async (historyId: number): Promise<boolean> => {
    try {
      await axios.delete<Response<undefined>>('/history', {
        data: {
          history_id: historyId,
        },
      })

      histories.value = histories.value.filter((history) => history.history_id !== historyId)
      return true
    } catch {
      return false
    }
  }

  const updateHistoryProgress = (historyId: number, progress: number) => {
    const existingIndex = histories.value.findIndex((history) => history.history_id === historyId)
    if (existingIndex < 0) return

    const normalizedProgress = Math.min(1, Math.max(0, progress))
    const nextHistories = [...histories.value]
    nextHistories[existingIndex] = {
      ...nextHistories[existingIndex],
      progress: normalizedProgress,
    }
    histories.value = nextHistories
  }

  return {
    histories,
    subjects,
    tags,
    isFetching,
    hasCreatedHistory,
    latestCreatedHistoryId,
    isStreaming,
    createError,
    donePayload,
    createProgress,
    clearCreatedHistoryState,
    fetchHistories,
    createQuestions,
    deleteHistory,
    updateHistoryProgress,
  }
})
