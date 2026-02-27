/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useSubmit）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import type {
  AttemptAnswerInput,
  AttemptSubmitData,
  AttemptSubmitSummary,
  Response,
} from '@/types'
import { computed, shallowRef } from 'vue'

/** 批量提交作答时所需的入参结构 */
interface SubmitQuestionsPayload {
  historyId: number
  answers: AttemptAnswerInput[]
}

/** 批量提交后的结果汇总 */
interface SubmitResult {
  /** 后端返回的提交汇总 */
  summary: AttemptSubmitSummary | null
  /** 是否提交成功 */
  success: boolean
  /** 失败原因（成功时为 null） */
  firstError: string | null
}

/**
 * 题目批量提交 composable。
 *
 * 设计要点：
 * - 使用新版 /attempt 接口一次性提交整套题；
 * - 统一返回 success/summary，便于组件层处理提示与状态更新。
 */
export function useSubmit() {
  /** 当前是否正在提交 */
  const isSubmitting = shallowRef(false)
  /** 最后一次提交的错误信息（null 表示全部成功） */
  const error = shallowRef<string | null>(null)

  /** 最近一次提交的后端汇总信息 */
  const summary = shallowRef<AttemptSubmitSummary | null>(null)

  /**
   * 将题目作答批量提交到后端 /attempt 接口。
   */
  const submitRequest = async (historyId: number, answers: AttemptAnswerInput[]) => {
    const response = await axios.post<Response<AttemptSubmitData>>('/attempt', {
      history_id: historyId,
      answers,
    })
    return response.data.data.summary
  }

  /**
   * 批量提交所有题目的作答。
   *
   * 流程：
   * 1. 重置状态；
   * 2. 若题目为空直接返回；
   * 3. 调用 /attempt 一次性提交；
   * 4. 返回 success/summary/firstError 供调用方更新 UI。
   */
  const submit = async ({ historyId, answers }: SubmitQuestionsPayload): Promise<SubmitResult> => {
    error.value = null
    summary.value = null
    isSubmitting.value = true

    if (answers.length === 0) {
      isSubmitting.value = false
      return {
        summary: null,
        success: false,
        firstError: null,
      }
    }

    try {
      const nextSummary = await submitRequest(historyId, answers)
      summary.value = nextSummary
      return {
        summary: nextSummary,
        success: true,
        firstError: null,
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : String(requestError)
      error.value = message
      return {
        summary: null,
        success: false,
        firstError: message,
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    submit,
    summary,
    error,
    isSubmitting: computed(() => isSubmitting.value),
  }
}
