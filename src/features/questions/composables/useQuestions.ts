import axios from '@/axios'
import type { Question, Response } from '@/types'
import { onScopeDispose, shallowRef } from 'vue'

export function useQuestions(historyId: number) {
  const isFetching = shallowRef(false)
  const questions = shallowRef<Question[]>([])
  const error = shallowRef<string | null>(null)

  let controller: AbortController | null = null

  const cancel = () => {
    controller?.abort()
    controller = null
    isFetching.value = false
  }

  const fetchQuestions = async () => {
    cancel()

    const requestController = new AbortController()
    controller = requestController
    isFetching.value = true
    error.value = null

    try {
      const response = await axios.get<Response<Question[]>>('/questions', {
        params: { history_id: historyId },
        signal: requestController.signal,
      })
      questions.value = response.data.data ?? []
    } catch (requestError) {
      const isAbortError =
        requestError instanceof Error &&
        (requestError.name === 'AbortError' || requestError.name === 'CanceledError')

      if (!isAbortError) {
        error.value = requestError instanceof Error ? requestError.message : String(requestError)
      }
    } finally {
      if (controller === requestController) {
        isFetching.value = false
      }
    }
  }

  onScopeDispose(cancel)

  void fetchQuestions()

  return { questions, error, isFetching, fetchQuestions, cancel }
}
