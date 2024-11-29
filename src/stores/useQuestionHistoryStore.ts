import { defineStore, storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import type { AddHistoryResponse, History, Response } from '@/types'
import { useUserStore } from '@/stores/user'
import axios from '@/axios'

export const useQuestionHistoryStore = defineStore('QuestionHistory', () => {
  const histories = ref<History[]>([])
  const subjects = computed(() => Array.from(new Set(histories.value.map((h) => h.subject))))
  const tags = computed(() => Array.from(new Set(histories.value.map((h) => h.tag))))

  const { name } = storeToRefs(useUserStore())

  const isFetching = ref(false)

  const fetch = () => {
    isFetching.value = true
    const error = ref<string | null>(null)

    axios
      .get<Response<History[]>>('/history', {
        method: 'get',
        params: { username: name.value },
      })
      .then((response) => {
        histories.value = response.data.data ?? []
      })
      .catch(() => {
        error.value = 'Network error, please try again later.'
      })
      .finally(() => {
        isFetching.value = false
      })

    return error
  }

  const added = ref(false)

  const add = (subject: string, tag: string, number: number, type: string) => {
    isFetching.value = true
    const error = ref<string | null>(null)
    axios
      .post<Response<AddHistoryResponse>>('/questions/create', {
        data: { name: name.value, subject, tag, number, type },
      })
      .then((response) => {
        if (!response.data.data) {
          return
        }
        histories.value.push(response.data.data.history[0])
      })
      .catch(() => {
        error.value = 'could not create new question, please try again later.'
      })
      .finally(() => {
        isFetching.value = false
        added.value = true
      })
  }

  const del = (id: number) => {
    axios
      .post<Response<undefined>>('/history', { data: { username: name.value, history_id: id } })
      .then(() => {
        histories.value = histories.value.filter((h) => h.history_id !== id)
      })
  }

  return { histories, subjects, tags, added, fetch, add, del }
})
