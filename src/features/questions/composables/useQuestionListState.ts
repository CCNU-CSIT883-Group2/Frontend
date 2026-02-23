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
    resetToken.value += 1
  }

  return {
    resetToken,
    collapsedStates,
    answeredStates,
    resetState,
  }
}
