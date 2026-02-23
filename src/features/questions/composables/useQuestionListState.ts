/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useQuestionListState）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import type { Question } from '@/types'
import { ref, watch, type Ref } from 'vue'

interface UseQuestionListStateOptions {
  questions: Ref<Question[]>
  attempts: Ref<number[][]>
  isAnswerSaved: Ref<boolean>
}

export const useQuestionListState = ({
  questions,
  attempts,
  isAnswerSaved,
}: UseQuestionListStateOptions) => {
  const resetToken = ref(0)
  const collapsedStates = ref<boolean[]>([])
  const answeredStates = ref<boolean[]>([])

  const syncStateWithQuestions = () => {
    const questionCount = questions.value.length

    // 保留已有折叠状态，题目数量变化时仅补齐缺失项。
    collapsedStates.value = Array.from(
      { length: questionCount },
      (_, index) => collapsedStates.value[index] ?? false,
    )

    attempts.value = Array.from({ length: questionCount }, (_, index) => attempts.value[index] ?? [])
    answeredStates.value = Array.from({ length: questionCount }, () => isAnswerSaved.value)
  }

  watch(
    () => questions.value,
    syncStateWithQuestions,
    { immediate: true },
  )

  watch(
    isAnswerSaved,
    (saved) => {
      if (saved) {
        answeredStates.value = questions.value.map(() => true)
        return
      }

      answeredStates.value = questions.value.map(
        (_, index) => (attempts.value[index] ?? []).length > 0,
      )
    },
    { immediate: true },
  )

  const resetState = () => {
    attempts.value = questions.value.map(() => [])
    answeredStates.value = questions.value.map(() => false)
    isAnswerSaved.value = false
    // 递增 token 触发子组件内部状态重置（如选项与折叠面板）。
    resetToken.value += 1
  }

  return {
    resetToken,
    collapsedStates,
    answeredStates,
    resetState,
  }
}
