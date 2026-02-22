import type { Question, Response } from '@/types'
import { ref, shallowRef } from 'vue'
import axios from '@/axios'

export function useQuestions(historyID: number) {
  const isFetching = ref(true)
  const questions = shallowRef<Question[]>([])
  const error = ref<string | null>(null)

  const controller = new AbortController()

  const fetchQuestions = async () => {
    try {
      const response = await axios.get<Response<Question[]>>(`/questions`, {
        params: { history_id: historyID },
        signal: controller.signal,
      })
      questions.value = response.data.data ?? []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isFetching.value = false
    }
  }

  void fetchQuestions()

  const cancel = () => {
    controller.abort()
  }

  return { questions, error, isFetching, cancel }
}
