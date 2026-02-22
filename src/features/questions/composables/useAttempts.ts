import axios from '@/axios'
import { useUserStore } from '@/stores/userStore'
import type { Attempt, Response } from '@/types'
import { storeToRefs } from 'pinia'
import { onScopeDispose, shallowRef } from 'vue'

export function useAttempts(historyId: number) {
  const isFetching = shallowRef(false)
  const attempts = shallowRef<Attempt[]>([])
  const error = shallowRef<string | null>(null)

  const { name: username } = storeToRefs(useUserStore())

  let controller: AbortController | null = null

  const cancel = () => {
    controller?.abort()
    controller = null
    isFetching.value = false
  }

  const fetchAttempts = async () => {
    cancel()

    const requestController = new AbortController()
    controller = requestController
    isFetching.value = true
    error.value = null

    try {
      const response = await axios.get<Response<Attempt[]>>('/attempt', {
        params: { history_id: historyId, username: username.value },
        signal: requestController.signal,
      })
      attempts.value = response.data.data ?? []
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

  void fetchAttempts()

  return { attempts, error, isFetching, fetchAttempts, cancel }
}
