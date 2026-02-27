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

/**
 * 答题面板的核心状态管理 composable。
 *
 * 职责：
 * 1. 并发拉取题目列表（useQuestions）和历史作答（useAttempts）；
 * 2. 两个请求均完成后，将历史作答按 question_id 对齐到题目索引；
 * 3. 组件卸载时主动取消所有飞行中请求，避免异步回写已卸载组件的状态。
 *
 * @param historyId - 当前题集 ID
 */
export const useAnswerPanelState = (historyId: number) => {
  /** 当前题集的题目列表（等两个请求都完成后再写入） */
  const questions = ref<Question[]>([])
  /**
   * 当前题集每道题的用户作答（按题目数组索引对齐）。
   * 空数组表示该题尚未作答。
   */
  const attempts = ref<number[][]>([])
  /** 是否已提交并保存本题集的全部作答 */
  const isAnswerSaved = ref(false)
  /** 题集首次加载时，已保存过答案的题目 ID 列表 */
  const initialSavedQuestionIds = ref<number[]>([])
  /** 题目与作答是否都已完成一次对齐（用于开启自动保存监听） */
  const isHydrated = ref(false)

  const {
    questions: fetchedQuestions,
    isFetching: isFetchingQuestions,
    cancel: cancelFetchingQuestions,
  } = useQuestions(historyId)

  const {
    attempts: fetchedAttempts,
    isFetching: isFetchingAttempts,
    fetchAttempts,
    cancel: cancelFetchingAttempts,
  } = useAttempts(historyId)

  /**
   * 当题目列表加载完成后，立即重建 attempts 结构（全部初始化为空数组）。
   * 这样即使 attempts 请求还在进行中，UI 也能先渲染出题目框架。
   * immediate: true 确保初始值也会触发一次同步。
   */
  watch(
    [isFetchingQuestions, fetchedQuestions],
    ([isQuestionsLoading]) => {
      if (isQuestionsLoading) return

      // 题目集切换后先重建 attempts 结构，保证索引与当前题目列表一一对应。
      questions.value = fetchedQuestions.value
      attempts.value = fetchedQuestions.value.map(() => [])
      initialSavedQuestionIds.value = []
      isAnswerSaved.value = false
      isHydrated.value = false
    },
    { immediate: true },
  )

  /**
   * 当题目列表与历史作答均加载完成后，将历史作答按 question_id 对齐写入。
   * 使用 Map 而非按数组下标对齐，是为了防止后端返回顺序与本地题目顺序不一致。
   */
  watch(
    [isFetchingQuestions, isFetchingAttempts, fetchedAttempts],
    ([isQuestionsLoading, isAttemptsLoading]) => {
      if (isQuestionsLoading || isAttemptsLoading) return

      // 以 question_id 为键构建快查 Map
      const attemptsByQuestionId = new Map<number, number[]>()
      fetchedAttempts.value.forEach((attemptItem) => {
        attemptsByQuestionId.set(attemptItem.question_id, attemptItem.user_answers)
      })
      const submittedByQuestionId = new Map<number, boolean>()
      fetchedAttempts.value.forEach((attemptItem) => {
        submittedByQuestionId.set(
          attemptItem.question_id,
          (submittedByQuestionId.get(attemptItem.question_id) ?? false) || attemptItem.is_submitted,
        )
      })

      // 按题目 id 对齐历史作答，避免按数组下标对齐造成错位。
      attempts.value = questions.value.map(
        (question) => attemptsByQuestionId.get(question.question_id) ?? [],
      )
      // 记录初始已保存状态（用于自动保存标识初始化）
      initialSavedQuestionIds.value = questions.value
        .filter((question) => (attemptsByQuestionId.get(question.question_id) ?? []).length > 0)
        .map((question) => question.question_id)
      // 只要该 history 存在已提交记录，就将整个题集视为已提交（锁定答题控件）。
      // 这样可以避免后端返回顺序或历史多条 attempt 干扰判定。
      const hasSubmittedAttempt = fetchedAttempts.value.some((attemptItem) => attemptItem.is_submitted)
      isAnswerSaved.value =
        hasSubmittedAttempt ||
        (questions.value.length > 0 &&
          questions.value.every((question) => submittedByQuestionId.get(question.question_id) === true))
      isHydrated.value = true
    },
    { immediate: true },
  )

  /** 重新拉取当前题集的作答记录（如 reset 后对齐后端状态） */
  const reloadAttempts = async () => {
    await fetchAttempts()
  }

  /**
   * 组件卸载时主动取消两个飞行中的请求。
   * historyId 快速切换（新面板挂载时旧面板卸载）或页面离开时均会触发。
   */
  onUnmounted(() => {
    // historyId 快速切换或组件卸载时，主动取消请求，避免旧请求回写状态。
    cancelFetchingQuestions()
    cancelFetchingAttempts()
  })

  return {
    questions,
    attempts,
    isAnswerSaved,
    initialSavedQuestionIds,
    isHydrated,
    reloadAttempts,
  }
}
