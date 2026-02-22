import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useDark } from '@vueuse/core'

interface UserState {
  name: string
  user_id: string
  token: string
  email: string
  role: string
}

type QuestionGenerateModel = 'ChatGPT' | 'Kimi'

const STORAGE_KEYS = {
  name: 'username',
  userId: 'user_id',
  token: 'token',
  email: 'email',
  role: 'role',
} as const

const EMPTY_USER: UserState = {
  name: '',
  user_id: '',
  token: '',
  email: '',
  role: '',
}

function getStoredUser(): UserState {
  return {
    name: localStorage.getItem(STORAGE_KEYS.name) ?? EMPTY_USER.name,
    user_id: localStorage.getItem(STORAGE_KEYS.userId) ?? EMPTY_USER.user_id,
    token: localStorage.getItem(STORAGE_KEYS.token) ?? EMPTY_USER.token,
    email: localStorage.getItem(STORAGE_KEYS.email) ?? EMPTY_USER.email,
    role: localStorage.getItem(STORAGE_KEYS.role) ?? EMPTY_USER.role,
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
  // User object is replaced as a whole for simpler persistence semantics.
  const user = shallowRef<UserState>(getStoredUser())
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
    setUser({ ...user.value, ...partial })
  }

  const clearUser = () => {
    user.value = { ...EMPTY_USER }
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
      generateModel: 'ChatGPT' as QuestionGenerateModel,
    },
  })

  return { settings }
})
