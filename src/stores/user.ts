import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useDark } from '@vueuse/core'

export const useUserStore = defineStore('user', () => {
  const user = ref({
    name: localStorage.getItem('username') ?? '',
    user_id: localStorage.getItem('user_id') ?? '',
    token: localStorage.getItem('token') ?? '',
    email: localStorage.getItem('email') ?? '',
    role: localStorage.getItem('role') ?? '',
  })
  const role = computed(() => user.value.role)
  const email = computed(() => user.value.email)
  const name = computed(() => user.value.name)
  const userId = computed(() => user.value.user_id)
  const token = computed(() => user.value.token)

  return { user, role, email, name, userId, token }
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
