import { ref, shallowRef } from 'vue'
import type { Attempt, Response } from '@/types'
import axios from '@/axios'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

export function useAttempts(history_id: number) {
  const isFetching = ref(true)
  const attempts = shallowRef<Attempt[]>([])
  const error = ref<string | null>(null)
  const { name } = storeToRefs(useUserStore())

  const controller = new AbortController()

  const fetchAttempts = async () => {
    try {
      const response = await axios.get<Response<Attempt[]>>(`/attempt`, {
        params: { history_id, username: name.value },
        signal: controller.signal,
      })
      attempts.value = response.data.data ?? []
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isFetching.value = false
    }
  }

  void fetchAttempts()

  const cancel = () => {
    controller.abort()
  }

  return { attempts, error, isFetching, cancel }
}
