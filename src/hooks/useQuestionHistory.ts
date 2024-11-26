import { useUserStore } from '@/stores/user'
import { ref, type Ref, shallowRef } from 'vue'
import type { History, Response } from '@/types'
import axios from '@/axios'

export function useQuestionHistory(): {
  history: Ref<History[]>
  error: Ref<string>
  isFetching: Ref<boolean>
  cancel: () => void
} {
  const { name } = useUserStore()

  const isFetching = ref(true)
  const history = shallowRef([] as History[])
  const error = ref('')

  const controller = new AbortController()
  const signal = controller.signal

  axios
    .get<Response<History[]>>('/history', {
      method: 'get',
      data: { username: name },
      signal,
    })
    .then((response) => {
      history.value = response.data.data
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

  return { history, error, isFetching, cancel }
}
