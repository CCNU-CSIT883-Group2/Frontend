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

interface SubmitResult {
  answeredMap: Map<number, boolean>
  successCount: number
  failureCount: number
  firstError: string | null
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
    const response = await axios.post<Response<AttemptPostData>>('/attempt', {
      username: username.value,
      history_id: historyId,
      question_id: questionId,
      type,
      choice_answers: choiceAnswers,
    })

    return response.data.data.attempt.question_id
  }

  const submit = async ({
    historyId,
    type,
    questionIds,
    answers,
  }: SubmitQuestionsPayload): Promise<SubmitResult> => {
    answeredMap.value = new Map()
    error.value = null
    pendingCount.value = questionIds.length

    if (questionIds.length === 0) {
      return {
        answeredMap: answeredMap.value,
        successCount: 0,
        failureCount: 0,
        firstError: null,
      }
    }

    const settledResults = await Promise.allSettled(
      questionIds.map((questionId, index) =>
        submitRequest(historyId, type, questionId, answers[index] ?? []),
      ),
    )

    const nextAnsweredMap = new Map<number, boolean>()
    const errors: string[] = []

    settledResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        nextAnsweredMap.set(result.value, true)
        return
      }

      const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
      errors.push(message)
    })

    answeredMap.value = nextAnsweredMap

    const firstError = errors[0] ?? null
    const failureCount = errors.length
    const successCount = nextAnsweredMap.size

    if (failureCount > 0) {
      error.value = firstError
    }

    pendingCount.value = 0

    return {
      answeredMap: nextAnsweredMap,
      successCount,
      failureCount,
      firstError,
    }
  }

  return {
    submit,
    answeredMap,
    error,
    pendingCount,
    isSubmitting,
  }
}
