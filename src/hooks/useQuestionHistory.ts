import { type Ref, ref } from 'vue'
import type { History, Response } from '@/types'

export async function useQuestionHistory(username: string): Promise<{
  data: Ref<History[]>
  error: Ref<string>
  loading: Ref<boolean>
  fetchData: () => Promise<void>
}> {
  const data = ref()
  const error = ref('')
  const loading = ref(true)

  const controller = new AbortController()
  const { signal } = controller

  const fetchData = async () => {
    loading.value = true

    const response = await fetch(`${import.meta.env.BASE_URL}/history_get`, {
      signal,
      body: JSON.stringify({ username }),
      method: 'GET',
    })

    if (!response.ok) {
      error.value = 'Network error'
    }

    const json = (await response.json()) as Response<History[]>

    if (json.code !== 200) {
      error.value = json.info
    } else {
      data.value = json.data
    }

    loading.value = false
  }

  return { data, error, loading, fetchData }
}
