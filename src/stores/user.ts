import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useDark } from '@vueuse/core'

interface UserState {
  name: string
  user_id: string
  token: string
  email: string
  role: string
}

const STORAGE_KEYS = {
  name: 'username',
  userId: 'user_id',
  token: 'token',
  email: 'email',
  role: 'role',
} as const

function getStoredUser(): UserState {
  return {
    name: localStorage.getItem(STORAGE_KEYS.name) ?? '',
    user_id: localStorage.getItem(STORAGE_KEYS.userId) ?? '',
    token: localStorage.getItem(STORAGE_KEYS.token) ?? '',
    email: localStorage.getItem(STORAGE_KEYS.email) ?? '',
    role: localStorage.getItem(STORAGE_KEYS.role) ?? '',
  }
}

function persistUser(user: UserState) {
  localStorage.setItem(STORAGE_KEYS.name, user.name)
  localStorage.setItem(STORAGE_KEYS.userId, user.user_id)
  localStorage.setItem(STORAGE_KEYS.token, user.token)
  localStorage.setItem(STORAGE_KEYS.email, user.email)
  localStorage.setItem(STORAGE_KEYS.role, user.role)
}

function clearPersistedUser() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
}

export const useUserStore = defineStore('user', () => {
  const user = ref<UserState>(getStoredUser())
  const isAuthenticated = computed(() => user.value.token !== '')

  const role = computed(() => user.value.role)
  const email = computed(() => user.value.email)
  const name = computed(() => user.value.name)
  const userId = computed(() => user.value.user_id)
  const token = computed(() => user.value.token)

  const setUser = (next: UserState) => {
    user.value = { ...next }
    persistUser(user.value)
  }

  const patchUser = (partial: Partial<UserState>) => {
    user.value = { ...user.value, ...partial }
    persistUser(user.value)
  }

  const clearUser = () => {
    user.value = {
      name: '',
      user_id: '',
      token: '',
      email: '',
      role: '',
    }
    clearPersistedUser()
  }

  return {
    user,
    role,
    email,
    name,
    userId,
    token,
    isAuthenticated,
    setUser,
    patchUser,
    clearUser,
  }
})

// Display preferences for question panels.
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
