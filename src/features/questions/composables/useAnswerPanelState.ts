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

      attempts.value = questions.value.map(
        (question) => attemptsByQuestionId.get(question.question_id) ?? [],
      )
      isAnswerSaved.value = attempts.value.every((attempt) => attempt.length > 0)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    cancelFetchingQuestions()
    cancelFetchingAttempts()
  })

  return {
    questions,
    attempts,
    isAnswerSaved,
  }
}
