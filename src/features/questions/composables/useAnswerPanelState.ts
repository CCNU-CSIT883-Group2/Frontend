/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useAnswerPanelState）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useAttempts } from '@/features/questions/composables/useAttempts'
import { useQuestions } from '@/features/questions/composables/useQuestions'
import type { Question } from '@/types'
import { onUnmounted, ref, watch } from 'vue'

export const useAnswerPanelState = (historyId: number) => {
  const questions = ref<Question[]>([])
  const attempts = ref<number[][]>([])
  const isAnswerSaved = ref(false)

  const {
    questions: fetchedQuestions,
    isFetching: isFetchingQuestions,
    cancel: cancelFetchingQuestions,
  } = useQuestions(historyId)

  const {
    attempts: fetchedAttempts,
    isFetching: isFetchingAttempts,
    cancel: cancelFetchingAttempts,
  } = useAttempts(historyId)

  watch(
    [isFetchingQuestions, fetchedQuestions],
    ([isQuestionsLoading]) => {
      if (isQuestionsLoading) return

      // 题目集切换后先重建 attempts 结构，保证索引与当前题目列表一一对应。
      questions.value = fetchedQuestions.value
      attempts.value = fetchedQuestions.value.map(() => [])
    },
    { immediate: true },
  )

  watch(
    [isFetchingQuestions, isFetchingAttempts, fetchedAttempts],
    ([isQuestionsLoading, isAttemptsLoading]) => {
      if (isQuestionsLoading || isAttemptsLoading) return

      const attemptsByQuestionId = new Map<number, number[]>()
      fetchedAttempts.value.forEach((attemptItem) => {
        attemptsByQuestionId.set(attemptItem.question_id, attemptItem.user_answers)
      })

      // 按题目 id 对齐历史作答，避免按数组下标对齐造成错位。
      attempts.value = questions.value.map(
        (question) => attemptsByQuestionId.get(question.question_id) ?? [],
      )
      isAnswerSaved.value = attempts.value.every((attempt) => attempt.length > 0)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    // historyId 快速切换或组件卸载时，主动取消请求，避免旧请求回写状态。
    cancelFetchingQuestions()
    cancelFetchingAttempts()
  })

  return {
    questions,
    attempts,
    isAnswerSaved,
  }
}
