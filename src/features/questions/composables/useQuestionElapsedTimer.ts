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
