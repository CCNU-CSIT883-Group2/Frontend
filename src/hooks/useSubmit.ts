import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { reactive, ref } from 'vue'
import axios from '@/axios'
import type { AttemptPostData, Response } from '@/types'

export function useSubmit(
  historyId: number,
  type: string,
  questionIds: number[],
  answers: number[][],
) {
  const { name } = storeToRefs(useUserStore())

  const pendingCount = ref(questionIds.length)
  const error = ref<string | null>(null)
  const answered = reactive<Map<number, boolean>>(new Map())

  if (questionIds.length === 0) {
    pendingCount.value = 0
    return { answered, error, isFetching: pendingCount }
  }

  const submitRequest = (questionId: number, choiceAnswers: number[]) =>
    axios
      .post<Response<AttemptPostData>>('/attempt', {
        username: name.value,
        history_id: historyId,
        question_id: questionId,
        type,
        choice_answers: choiceAnswers,
      })
      .then((response) => {
        answered.set(response.data.data.attempt.question_id, true)
      })
      .catch((err) => {
        error.value = err instanceof Error ? err.message : String(err)
      })
      .finally(() => {
        pendingCount.value -= 1
      })

  void Promise.allSettled(questionIds.map((questionId, index) => submitRequest(questionId, answers[index])))

  return { answered, error, isFetching: pendingCount }
}
