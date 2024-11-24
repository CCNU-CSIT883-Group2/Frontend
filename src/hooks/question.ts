import { type Ref, ref } from 'vue'
import type { Question } from '@/types'

export async function useQuestions(historyID: number): Promise<{
  data: Ref<Question[]>
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
      body: JSON.stringify({ historyID }),
      method: 'GET',
    })

    if (!response.ok) {
      error.value = 'Failed to fetch data'
    }
    data.value = (await response.json()) as Question[]

    loading.value = false
  }

  return { data, error, loading, fetchData }
}
