import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useDark } from '@vueuse/core'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    name: localStorage.getItem('username') ?? 'cyx',
    uid: localStorage.getItem('uid') ?? '123123',
    token: localStorage.getItem('token') ?? '123123',
    email: localStorage.getItem('email') ?? '123123',
    role: localStorage.getItem('role') ?? '123123',
  })
  const role = computed(() => user.value.role)
  const email = computed(() => user.value.email)
  const name = computed(() => user.value.name)
  const uid = computed(() => user.value.uid)
  const token = computed(() => user.value.token)

  return { user, role, email, name, uid, token }
})

//显示答题时间和题目难度
export const useUserSettingsStore = defineStore('userSettings', () => {
  const settings = ref({
    darkMode: useDark(),
    questions: {
      showDifficulty: true,
      showTime: false,
      generate_model: 'ChatGPT',
    },
  })

  return { settings }
})
