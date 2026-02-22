import type { Question, Response } from '@/types'
import { ref, shallowRef } from 'vue'
import axios from '@/axios'

export function useQuestions(historyID: number) {
  const isFetching = ref(true)
  const questions = shallowRef([] as Question[])
  const error = ref('')

  const controller = new AbortController()
  const signal = controller.signal

  axios
    .get<Response<Question[]>>(`/questions`, {
      params: { history_id: historyID },
      signal,
    })
    .then((response) => {
      questions.value = response.data.data ?? []
    })
    .catch((err) => {
      error.value = err.toString()
    })
    .finally(() => {
      isFetching.value = false
    })

  const cancel = () => {
    if (controller) {
      controller.abort()
    }
  }

  return { questions, error, isFetching, cancel }
}
