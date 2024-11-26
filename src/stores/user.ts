import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    name: 'Evan You',
    uid: '123123',
    token:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVSUQiOiIyZGZiY2Y0Zi03MmZiLTQ1YmYtYmZlNC1iOTE1NjUyMDcyMjEiLCJuYW1lIjoiYmJiIiwicGFzc3dvcmQiOiIxMjM0NTYiLCJlbWFpbCI6ImJiYmJiYkBiYmIuY29tIiwicm9sZSI6InRlYWNoZXIifQ.GOH6Z5WImZQRyirO2XMrismD2Q_n_61KctWeM1ACvME',
  })
  const name = computed(() => user.value.name)
  const uid = computed(() => user.value.uid)
  const token = computed(() => user.value.token)

  return { user, name, uid, token }
})

export const useUserSettingsStore = defineStore('userSettings', () => {
  const settings = ref({ darkMode: false, questions: { showDifficulty: true } })

  return { settings }
})
