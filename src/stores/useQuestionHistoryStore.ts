import axios from '@/axios'
import type {
  CreateQuestionRequest,
  History,
  QuestionsCreateData,
  QuestionsCreateProgressState,
  QuestionsCreateStreamDonePayload,
  Response,
} from '@/types'
import { streamQuestionCreation } from '@/services/questionCreationStream'
import { useUserSettingsStore, useUserStore } from '@/stores/user'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

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
        onDone: (payload) => {
          applyCreateDonePayload(payload)
        },
      })
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
