import axios from '@/axios'
import type { Response } from '@/types'
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

type QuestionGenerateModel = string

interface ModelsData {
  name: string
  models: string[]
}

interface QuestionModelOption {
  label: string
  value: QuestionGenerateModel
}

const MODEL_LABEL_BY_CODE: Record<string, string> = {
  C: 'ChatGPT',
  K: 'Kimi',
  D: 'Doubao',
  T: 'Test',
  G: 'GLM',
}

const MODEL_CODE_BY_ALIAS: Record<string, string> = {
  C: 'C',
  CHATGPT: 'C',
  K: 'K',
  KIMI: 'K',
  D: 'D',
  DOUBAO: 'D',
  T: 'T',
  TEST: 'T',
  G: 'G',
  GLM: 'G',
}

const DEFAULT_MODEL_OPTIONS: QuestionModelOption[] = [
  { label: MODEL_LABEL_BY_CODE.C, value: 'C' },
  { label: MODEL_LABEL_BY_CODE.K, value: 'K' },
]

const normalizeModelCode = (rawModel: string) => {
  const normalized = rawModel.trim().toUpperCase()
  if (!normalized) return ''
  return MODEL_CODE_BY_ALIAS[normalized] ?? normalized
}

const toQuestionModelOption = (modelCode: string): QuestionModelOption => ({
  value: modelCode,
  label: MODEL_LABEL_BY_CODE[modelCode] ?? modelCode,
})

const normalizeModelCodes = (rawModels: string[]) =>
  Array.from(new Set(rawModels.map(normalizeModelCode).filter(Boolean)))

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
  const darkMode = useDark()
  const availableModels = shallowRef<QuestionModelOption[]>([...DEFAULT_MODEL_OPTIONS])
  const isLoadingModels = ref(false)
  const hasLoadedModels = ref(false)

  const settings = ref({
    darkMode,
    questions: {
      showDifficulty: true,
      showTime: false,
      generateModel: 'C' as QuestionGenerateModel,
    },
  })

  const setDarkMode = (next: boolean) => {
    if (darkMode.value === next) return
    darkMode.value = next
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode.value)
  }

  const ensureSelectedModel = () => {
    const selectedModel = normalizeModelCode(settings.value.questions.generateModel)
    const availableModelSet = new Set(availableModels.value.map((option) => option.value))

    if (selectedModel && availableModelSet.has(selectedModel)) {
      settings.value.questions.generateModel = selectedModel
      return
    }

    settings.value.questions.generateModel = availableModels.value[0]?.value ?? 'C'
  }

  const setAvailableModels = (rawModels: string[]) => {
    const modelCodes = normalizeModelCodes(rawModels)

    if (modelCodes.length > 0) {
      availableModels.value = modelCodes.map(toQuestionModelOption)
      hasLoadedModels.value = true
      ensureSelectedModel()
      return
    }

    availableModels.value = [...DEFAULT_MODEL_OPTIONS]
    hasLoadedModels.value = false
    ensureSelectedModel()
  }

  const loadAvailableModels = async (force = false) => {
    if (isLoadingModels.value) return
    if (hasLoadedModels.value && !force) {
      ensureSelectedModel()
      return
    }

    isLoadingModels.value = true

    try {
      const response = await axios.get<Response<ModelsData>>('/models')
      const modelCodes = normalizeModelCodes(response.data.data?.models ?? [])
      availableModels.value =
        modelCodes.length > 0 ? modelCodes.map(toQuestionModelOption) : [...DEFAULT_MODEL_OPTIONS]
      hasLoadedModels.value = true
      ensureSelectedModel()
    } catch {
      ensureSelectedModel()
    } finally {
      isLoadingModels.value = false
    }
  }

  return {
    settings,
    darkMode,
    availableModels,
    isLoadingModels,
    setDarkMode,
    toggleDarkMode,
    setAvailableModels,
    loadAvailableModels,
  }
})
