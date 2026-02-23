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

/** 批量提交作答时所需的入参结构 */
interface SubmitQuestionsPayload {
  historyId: number
  type: string
  /** 题目 ID 列表（与 answers 数组下标一一对应） */
  questionIds: number[]
  /** 每道题的选项索引列表（多选题可有多个） */
  answers: number[][]
}

/** 批量提交后的结果汇总 */
interface SubmitResult {
  /** key=question_id，value=是否已成功提交（true=成功） */
  answeredMap: Map<number, boolean>
  /** 成功提交的题目数量 */
  successCount: number
  /** 失败的题目数量 */
  failureCount: number
  /** 第一条失败原因（用于展示错误通知），无失败时为 null */
  firstError: string | null
}

/**
 * 题目批量提交 composable。
 *
 * 设计要点：
 * - 使用 Promise.allSettled 并发提交所有题目，允许部分成功；
 * - 以后端返回的 question_id 作为成功标识，而非本地索引；
 * - pendingCount 累加所有并发请求数，任意一个完成都不会提前清零。
 */
export function useSubmit() {
  /** 当前进行中的请求数量（用于计算 isSubmitting） */
  const pendingCount = shallowRef(0)
  /** 已成功提交的题目 Map（question_id → true） */
  const answeredMap = shallowRef<Map<number, boolean>>(new Map())
  /** 最后一次提交的错误信息（null 表示全部成功） */
  const error = shallowRef<string | null>(null)

  /** 是否有任意请求在飞行中 */
  const isSubmitting = computed(() => pendingCount.value > 0)

  /**
   * 提交单道题的作答到后端 /attempt 接口。
   * 返回后端确认的 question_id，用于在 answeredMap 中标记成功。
   */
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

  /**
   * 批量提交所有题目的作答。
   *
   * 流程：
   * 1. 重置状态；
   * 2. 若题目为空直接返回空结果；
   * 3. Promise.allSettled 并发提交所有题目（允许部分失败）；
   * 4. 遍历结果：fulfilled → 写入 answeredMap，rejected → 收集错误消息；
   * 5. 返回完整的 SubmitResult 供调用方展示通知和更新 UI。
   */
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

    // 有任意失败时设置 error 供外部读取
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
