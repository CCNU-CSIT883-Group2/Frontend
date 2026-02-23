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
  /** 当前题目列表（外部传入，变化时触发状态同步） */
  questions: Ref<Question[]>
  /** 每道题的用户作答（外部传入，双向可写） */
  attempts: Ref<number[][]>
  /** 是否已提交保存（外部传入，双向可写） */
  isAnswerSaved: Ref<boolean>
}

/**
 * 题目列表的 UI 状态管理 composable。
 *
 * 职责：
 * 1. 管理每道题的折叠/展开状态（collapsedStates）；
 * 2. 根据作答情况和保存状态计算每道题是否"已作答"（answeredStates）；
 * 3. 提供重置方法（清空作答、恢复初始状态、触发子组件内部重置）。
 */
export const useQuestionListState = ({
  questions,
  attempts,
  isAnswerSaved,
}: UseQuestionListStateOptions) => {
  /**
   * 递增 token，用于通知子组件（QuestionListItem）重置其内部状态
   * （如已选选项、折叠面板），不依赖 key 重建节点，动画更流畅。
   */
  const resetToken = ref(0)
  /** 每道题的折叠状态（false=展开，true=折叠） */
  const collapsedStates = ref<boolean[]>([])
  /** 每道题是否已作答（用于界面标记） */
  const answeredStates = ref<boolean[]>([])

  /**
   * 将折叠状态和作答状态的数组长度与当前题目数量同步。
   * 题目增减时仅补齐缺失项，保留已有的折叠状态，避免用户已折叠的卡片被意外展开。
   */
  const syncStateWithQuestions = () => {
    const questionCount = questions.value.length

    // 保留已有折叠状态，题目数量变化时仅补齐缺失项。
    collapsedStates.value = Array.from(
      { length: questionCount },
      (_, index) => collapsedStates.value[index] ?? false,
    )

    // 作答数组同样补齐（已有的保留，新增的初始化为空数组）
    attempts.value = Array.from({ length: questionCount }, (_, index) => attempts.value[index] ?? [])
    // 初始 answeredStates 取决于 isAnswerSaved（已保存则全部标记为已答）
    answeredStates.value = Array.from({ length: questionCount }, () => isAnswerSaved.value)
  }

  // 题目列表变化时（切换题集、加载完成）立即同步 UI 状态
  watch(
    () => questions.value,
    syncStateWithQuestions,
    { immediate: true },
  )

  /**
   * 监听保存状态变化：
   * - 保存成功（saved=true）：所有题目标记为已答；
   * - 取消保存（saved=false）：根据实际 attempts 数组内容重新计算。
   */
  watch(
    isAnswerSaved,
    (saved) => {
      if (saved) {
        answeredStates.value = questions.value.map(() => true)
        return
      }

      // 有作答记录（数组非空）即视为已答
      answeredStates.value = questions.value.map(
        (_, index) => (attempts.value[index] ?? []).length > 0,
      )
    },
    { immediate: true },
  )

  /**
   * 重置所有作答状态（点击"刷新"按钮时调用）：
   * 1. 清空所有作答；
   * 2. 将所有题目标记为未作答；
   * 3. 标记为未保存；
   * 4. 递增 resetToken 通知子组件内部重置（选项、折叠面板等）。
   */
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
