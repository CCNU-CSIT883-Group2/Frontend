import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { reactive, ref } from 'vue'
import axios from '@/axios'
import type { AnswerResponse, Response } from '@/types'

export function useSubmit(
  history_id: number,
  type: string,
  question_ids: number[],
  answers: number[][],
) {
  const { name } = storeToRefs(useUserStore())

  const isFetching = ref(question_ids.length)
  const error = ref('')
  const answered = reactive<Map<number, boolean>>(new Map())

  for (let i = 0; i < question_ids.length; i++) {
    axios
      .post<Response<AnswerResponse>>('/attempt', {
        data: {
          username: name.value,
          history_id: history_id,
          QID: question_ids[i],
          type,
          choice_answers: answers[i],
        },
      })
      .then((response) => {
        answered.set(response.data.data.attempt.QID, true)
        isFetching.value--
      })
  }

  return { answered, error, isFetching }
}
