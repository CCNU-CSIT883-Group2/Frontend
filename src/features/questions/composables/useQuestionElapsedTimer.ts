/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useQuestionElapsedTimer）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useIntervalFn } from '@vueuse/core'
import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

interface UseQuestionElapsedTimerOptions {
  /** 是否已保存作答（true 时暂停计时） */
  isAnswerSaved: Ref<boolean>
  /** 题目总数（0 时暂停计时，避免空题集计时） */
  questionCount: Ref<number>
}

/**
 * 答题已用时计时器 composable。
 *
 * 功能：
 * 1. 每秒递增 timeUsed，格式化为"分:秒"字符串（如 "1:05"）；
 * 2. 已保存或题目为空时自动暂停；
 * 3. 作用域销毁时自动清理计时器，防止内存泄漏。
 */
export const useQuestionElapsedTimer = ({
  isAnswerSaved,
  questionCount,
}: UseQuestionElapsedTimerOptions) => {
  /** 已用秒数（从 0 开始） */
  const timeUsed = ref(0)

  /**
   * 格式化为"分:秒"字符串。
   * 秒数用 padStart(2, '0') 确保始终两位（如 "1:05" 而非 "1:5"）。
   */
  const elapsedTime = computed(() => {
    const minute = Math.floor(timeUsed.value / 60)
    const second = String(timeUsed.value % 60).padStart(2, '0')
    return `${minute}:${second}`
  })

  /**
   * 1 秒间隔计时器（immediate: false 表示创建时不立即触发）。
   * 由下方 watch 根据 isAnswerSaved 和 questionCount 状态来控制启停。
   */
  const timer = useIntervalFn(
    () => {
      timeUsed.value += 1
    },
    1000,
    { immediate: false },
  )

  /**
   * 监听保存状态和题目数量：
   * - 已保存或无题目时暂停计时（不计入无效时间）；
   * - 否则恢复计时。
   * immediate: true 确保初始状态也被处理（如切换到空题集时立即暂停）。
   */
  watch(
    [isAnswerSaved, questionCount],
    ([saved, count]) => {
      if (saved || count === 0) {
        timer.pause()
        return
      }

      timer.resume()
    },
    { immediate: true },
  )

  // 作用域销毁时暂停计时器，防止内存泄漏
  onScopeDispose(() => {
    timer.pause()
  })

  /** 重置计时器到 0（点击刷新按钮时调用） */
  const resetElapsedTime = () => {
    timeUsed.value = 0
  }

  return {
    elapsedTime,
    resetElapsedTime,
  }
}
