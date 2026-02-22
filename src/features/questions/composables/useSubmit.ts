import axios from '@/axios'
import { useUserStore } from '@/stores/userStore'
import type { AttemptPostData, Response } from '@/types'
import { storeToRefs } from 'pinia'
import { computed, shallowRef } from 'vue'

interface SubmitQuestionsPayload {
  historyId: number
  type: string
  questionIds: number[]
  answers: number[][]
}

export function useSubmit() {
  const { name: username } = storeToRefs(useUserStore())

  const pendingCount = shallowRef(0)
  const answeredMap = shallowRef<Map<number, boolean>>(new Map())
  const error = shallowRef<string | null>(null)

  const isSubmitting = computed(() => pendingCount.value > 0)

  const submitRequest = async (
    historyId: number,
    type: string,
    questionId: number,
    choiceAnswers: number[],
  ) => {
    try {
      const response = await axios.post<Response<AttemptPostData>>('/attempt', {
        username: username.value,
        history_id: historyId,
        question_id: questionId,
        type,
        choice_answers: choiceAnswers,
      })

      answeredMap.value.set(response.data.data.attempt.question_id, true)
    } catch (submitError) {
      error.value = submitError instanceof Error ? submitError.message : String(submitError)
    } finally {
      pendingCount.value -= 1
    }
  }

  const submit = async ({ historyId, type, questionIds, answers }: SubmitQuestionsPayload) => {
    answeredMap.value = new Map()
    error.value = null
    pendingCount.value = questionIds.length

    if (questionIds.length === 0) {
      return answeredMap.value
    }

    await Promise.allSettled(
      questionIds.map((questionId, index) =>
        submitRequest(historyId, type, questionId, answers[index] ?? []),
      ),
    )

    return answeredMap.value
  }

  return {
    submit,
    answeredMap,
    error,
    pendingCount,
    isSubmitting,
  }
}
