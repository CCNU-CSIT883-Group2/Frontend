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
import type { AttemptPostData, Response } from '@/types'
import { computed, shallowRef } from 'vue'

interface SubmitQuestionsPayload {
  historyId: number
  type: string
  questionIds: number[]
  answers: number[][]
}

interface SubmitResult {
  answeredMap: Map<number, boolean>
  successCount: number
  failureCount: number
  firstError: string | null
}

export function useSubmit() {
  const pendingCount = shallowRef(0)
  const answeredMap = shallowRef<Map<number, boolean>>(new Map())
  const error = shallowRef<string | null>(null)

  const isSubmitting = computed(() => pendingCount.value > 0)

  const submitRequest = async (
    historyId: number,
    type: string,
    questionId: number,
    choiceAnswers: number[],
  ) => {
    const response = await axios.post<Response<AttemptPostData>>('/attempt', {
      history_id: historyId,
      question_id: questionId,
      type,
      choice_answers: choiceAnswers,
    })

    return response.data.data.attempt.question_id
  }

  const submit = async ({
    historyId,
    type,
    questionIds,
    answers,
  }: SubmitQuestionsPayload): Promise<SubmitResult> => {
    answeredMap.value = new Map()
    error.value = null
    pendingCount.value = questionIds.length

    if (questionIds.length === 0) {
      return {
        answeredMap: answeredMap.value,
        successCount: 0,
        failureCount: 0,
        firstError: null,
      }
    }

    // 允许部分成功：即使某些题提交失败，也保留已成功题目的结果。
    const settledResults = await Promise.allSettled(
      questionIds.map((questionId, index) =>
        submitRequest(historyId, type, questionId, answers[index] ?? []),
      ),
    )

    const nextAnsweredMap = new Map<number, boolean>()
    const errors: string[] = []

    settledResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        // 以后端确认的 question_id 作为成功键，避免依赖本地索引顺序。
        nextAnsweredMap.set(result.value, true)
        return
      }

      const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
      errors.push(message)
    })

    answeredMap.value = nextAnsweredMap

    const firstError = errors[0] ?? null
    const failureCount = errors.length
    const successCount = nextAnsweredMap.size

    if (failureCount > 0) {
      error.value = firstError
    }

    pendingCount.value = 0

    return {
      answeredMap: nextAnsweredMap,
      successCount,
      failureCount,
      firstError,
    }
  }

  return {
    submit,
    answeredMap,
    error,
    pendingCount,
    isSubmitting,
  }
}
