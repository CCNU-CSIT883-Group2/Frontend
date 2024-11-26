import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    name: 'cyx',
    uid: '123123',
    token:
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJVSUQiOiI2MGVkMDBlZS1hOGJmLTRhNmUtOGQzYS0wMWUxMDE2MmZiYjMiLCJuYW1lIjoiY3l5eXgiLCJwYXNzd29yZCI6IjEyMzQ1NiIsImVtYWlsIjoiY3l5eXhAMTIzLmNvbSIsInJvbGUiOiJ0ZWFjaGVyIn0.Gy6VBI8nJk0yAb7V9ZZweByLIhpZQXWOPCd2T9-3rog',
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
