import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import type { AddHistoryResponse, History, Response } from '@/types'
import { useUserStore } from '@/stores/user'
import axios from '@/axios'

export const useQuestionHistoryStore = defineStore('QuestionHistory', () => {
  const histories = ref<History[]>([])
  const subjects = computed(() => Array.from(new Set(histories.value.map((h) => h.subject))))
  const tags = computed(() => Array.from(new Set(histories.value.map((h) => h.tag))))

  const { name, uid } = storeToRefs(useUserStore())

  const isFetching = ref(true)

  const fetch = () => {
    isFetching.value = true
    axios
      .get<Response<History[]>>('/history', {
        method: 'get',
        data: { username: name },
      })
      .then((response) => {
        histories.value = response.data.data
      })
      .finally(() => {
        isFetching.value = false
      })
  }

  const added = ref(false)

  const add = (subject: string, tag: string, number: number, type: string) => {
    isFetching.value = true
    axios
      .post<Response<AddHistoryResponse>>('/questions/create', {
        data: { UID: uid, subject, tag, number, type },
      })
      .then((response) => {
        histories.value.push(response.data.data.history[0])
      })
      .finally(() => {
        isFetching.value = false
        added.value = true
      })
  }

  const del = (id: number) => {
    axios
      .delete<Response<undefined>>('/history', { data: { username: name, history_id: id } })
      .then(() => {
        histories.value = histories.value.filter((h) => h.history_id !== id)
      })
  }

  return { histories, subjects, tags, added, fetch, add, del }
})
