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
  isAnswerSaved: Ref<boolean>
  questionCount: Ref<number>
}

export const useQuestionElapsedTimer = ({
  isAnswerSaved,
  questionCount,
}: UseQuestionElapsedTimerOptions) => {
  const timeUsed = ref(0)

  const elapsedTime = computed(() => {
    const minute = Math.floor(timeUsed.value / 60)
    const second = String(timeUsed.value % 60).padStart(2, '0')
    return `${minute}:${second}`
  })

  const timer = useIntervalFn(
    () => {
      timeUsed.value += 1
    },
    1000,
    { immediate: false },
  )

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

  onScopeDispose(() => {
    timer.pause()
  })

  const resetElapsedTime = () => {
    timeUsed.value = 0
  }

  return {
    elapsedTime,
    resetElapsedTime,
  }
}
