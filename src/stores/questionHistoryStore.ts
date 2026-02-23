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

/**
 * 题单历史仓库：管理用户的做题记录列表，以及 AI 出题的创建流程。
 *
 * 职责：
 * 1. 从后端拉取 / 本地维护题单列表（histories）；
 * 2. 通过 SSE 流式接口驱动 AI 出题，并实时更新创建进度；
 * 3. 提供删除、进度同步等列表操作。
 */
export const useQuestionHistoryStore = defineStore('questionHistory', () => {
  /** 所有题单历史记录（shallowRef 以减少深层响应性开销） */
  const histories = shallowRef<History[]>([])
  /** 是否正在进行网络请求（包括拉取列表和创建题目） */
  const isFetching = ref(false)

  // 供侧边栏感知"刚创建完成的题单"，用于自动选中最新记录。
  const hasCreatedHistory = ref(false)
  /** 最近一次成功创建的题单 ID，用于侧边栏自动高亮 */
  const latestCreatedHistoryId = shallowRef<number | null>(null)
  /** SSE 流式出题是否正在进行中 */
  const isStreaming = ref(false)
  /** 创建过程中的错误信息；成功或未开始时为 null */
  const createError = ref<string | null>(null)
  /** 流式出题完成后的完整载荷，包含题目列表和 history 记录 */
  const donePayload = shallowRef<QuestionsCreateStreamDonePayload | null>(null)
  /** 当前创建进度（total/current/percent） */
  const createProgress = shallowRef<QuestionsCreateProgressState>({ ...DEFAULT_CREATE_PROGRESS })

  /** 从历史列表中提取去重排序后的学科列表，供筛选下拉使用 */
  const subjects = computed(() =>
    Array.from(new Set(histories.value.map((history) => history.subject))).sort(),
  )
  /** 从历史列表中提取去重排序后的标签列表，供筛选下拉使用 */
  const tags = computed(() =>
    Array.from(new Set(histories.value.map((history) => history.tag))).sort(),
  )

  // 从其他 store 读取请求所需的凭证和设置（storeToRefs 保持响应性）
  const { token } = storeToRefs(useUserStore())
  const { settings } = storeToRefs(useUserSettingsStore())

  /** 局部更新创建进度（patch 语义，只覆盖传入的字段） */
  const setCreateProgress = (patch: Partial<QuestionsCreateProgressState>) => {
    createProgress.value = { ...createProgress.value, ...patch }
  }

  /** 重置所有创建相关状态（开始新一次创建前调用） */
  const resetCreateState = () => {
    createError.value = null
    donePayload.value = null
    createProgress.value = { ...DEFAULT_CREATE_PROGRESS }
  }

  /**
   * 标记最近一次创建成功，记录 historyId。
   * 侧边栏通过 hasCreatedHistory 监听此状态来自动选中新题单。
   */
  const markHistoryCreated = (historyId: number) => {
    latestCreatedHistoryId.value = historyId
    hasCreatedHistory.value = true
  }

  /** 侧边栏消费完创建信号后调用，清除自动选中标记 */
  const clearCreatedHistoryState = () => {
    hasCreatedHistory.value = false
    latestCreatedHistoryId.value = null
  }

  /** 在 histories 列表中插入或更新一条 History 记录 */
  const upsertHistory = (history: History) => {
    histories.value = upsertHistoryItem(histories.value, history)
  }

  /**
   * 将流式出题完成的载荷写入仓库：
   * 1. 存储完整 donePayload；
   * 2. 更新/插入该题单到列表；
   * 3. 将进度设为 100%；
   * 4. 触发侧边栏自动选中信号。
   */
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

  /**
   * 流式接口失败时的降级方案：直接调用普通 HTTP 接口创建题目。
   * 两种接口返回格式不同，通过 toDonePayloadFromCreateData 统一转换。
   */
  const createWithFallback = async (
    requestPayload: ReturnType<typeof buildCreateRequestPayload>,
  ) => {
    const response = await axios.post<Response<QuestionsCreateData>>(
      '/questions/create',
      requestPayload,
    )
    applyCreateDonePayload(toDonePayloadFromCreateData(response.data.data))
  }

  /**
   * 拉取当前用户的所有题单历史记录。
   * 返回 null 表示成功，返回错误字符串表示失败。
   */
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

  /**
   * 通过 AI 创建新题单（主流程）。
   *
   * 流程：
   * 1. 优先调用 SSE 流式接口，实时推送进度；
   * 2. 若流式接口抛出异常，自动降级到普通 HTTP 接口；
   * 3. 两种接口均失败时，记录错误信息并清零进度。
   */
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
        // SSE 开始事件：初始化 total，将 current/percent 归零
        onStart: (payload) => {
          createProgress.value = {
            total: payload.total,
            current: 0,
            percent: 0,
          }
        },
        // SSE 进度事件：逐步更新 current 和 percent
        onProgress: (payload) => {
          setCreateProgress({
            total: payload.total,
            current: payload.current,
            percent: payload.percent,
          })
        },
        // SSE 完成事件：写入完整载荷
        onDone: applyCreateDonePayload,
      })
      return
    } catch (streamError) {
      // 流式接口失败时回退到普通接口，尽可能保证用户操作可完成。
      try {
        await createWithFallback(requestPayload)
      } catch (fallbackError) {
        // 两种接口均失败：清零进度并记录错误（优先使用 fallback 错误信息）
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

  /**
   * 删除指定题单。
   * 成功时从本地列表移除，返回 true；失败时返回 false（不抛出，由 UI 层显示提示）。
   */
  const deleteHistory = async (historyId: number): Promise<boolean> => {
    try {
      await axios.delete<Response<undefined>>('/history', {
        data: {
          history_id: historyId,
        },
      })

      // 删除成功后过滤本地列表，触发响应性更新
      histories.value = histories.value.filter((history) => history.history_id !== historyId)
      return true
    } catch {
      return false
    }
  }

  /**
   * 同步某题单的作答进度到本地状态。
   * 通常在用户提交答案后由题目模块调用。
   */
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
