/**
 * 文件说明（是什么）：
 * - 本文件是「Pinia 状态仓库模块」。
 * - 管理全局/跨组件状态与相关动作（模块：questionHistoryStore）。
 *
 * 设计原因（为什么）：
 * - 集中维护状态变更入口，防止状态修改分散造成数据不一致。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import { API_BASE_URL } from '@/config'
import { streamQuestionCreation } from '@/services/questionCreationStream'
import {
  DEFAULT_CREATE_PROGRESS,
  buildCreateRequestPayload,
  toDonePayloadFromCreateData,
  updateHistoryProgressState,
  upsertHistoryItem,
} from '@/stores/questionHistory.helpers'
import { useUserSettingsStore, useUserStore } from '@/stores/userStore'
import type {
  History,
  QuestionsCreateData,
  QuestionsCreateProgressState,
  QuestionsCreateStreamDonePayload,
  Response,
} from '@/types'
import { defineStore, storeToRefs } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

export const useQuestionHistoryStore = defineStore('questionHistory', () => {
  const histories = shallowRef<History[]>([])
  const isFetching = ref(false)

  // 供侧边栏感知“刚创建完成的题单”，用于自动选中最新记录。
  const hasCreatedHistory = ref(false)
  const latestCreatedHistoryId = shallowRef<number | null>(null)
  const isStreaming = ref(false)
  const createError = ref<string | null>(null)
  const donePayload = shallowRef<QuestionsCreateStreamDonePayload | null>(null)
  const createProgress = shallowRef<QuestionsCreateProgressState>({ ...DEFAULT_CREATE_PROGRESS })

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
    createProgress.value = { ...DEFAULT_CREATE_PROGRESS }
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
    histories.value = upsertHistoryItem(histories.value, history)
  }

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

  const createWithFallback = async (
    requestPayload: ReturnType<typeof buildCreateRequestPayload>,
  ) => {
    const response = await axios.post<Response<QuestionsCreateData>>(
      '/questions/create',
      requestPayload,
    )
    applyCreateDonePayload(toDonePayloadFromCreateData(response.data.data))
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

    const requestPayload = buildCreateRequestPayload({
      subject,
      tag,
      number,
      type,
      model: settings.value.questions.generateModel,
    })

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
      // 流式接口失败时回退到普通接口，尽可能保证用户操作可完成。
      try {
        await createWithFallback(requestPayload)
      } catch (fallbackError) {
        createProgress.value = { ...DEFAULT_CREATE_PROGRESS }
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
    histories.value = updateHistoryProgressState(histories.value, historyId, progress)
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
