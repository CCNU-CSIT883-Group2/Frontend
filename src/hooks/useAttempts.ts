import { ref, shallowRef } from 'vue'
import type { Attempt, Response } from '@/types'
import axios from '@/axios'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

export function useAttempts(history_id: number) {
  const isFetching = ref(true)
  const attempts = shallowRef([] as Attempt[])
  const error = ref('')
  const { name } = storeToRefs(useUserStore())

  const controller = new AbortController()
  const signal = controller.signal

  axios
    .get<Response<Attempt[]>>(`/attempt`, {
      params: { history_id, username: name.value },
      signal,
    })
    .then((response) => {
      attempts.value = response.data.data ?? []
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

  return { attempts, error, isFetching, cancel }
}
