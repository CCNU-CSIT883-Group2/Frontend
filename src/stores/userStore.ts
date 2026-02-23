import axios from '@/axios'
import type { Response } from '@/types'
import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useDark, useStorage } from '@vueuse/core'

interface UserState {
  name: string
  user_id: string
  token: string
  email: string
  role: string
}

type QuestionGenerateModel = string

interface UserSettingsState {
  questions: {
    showDifficulty: boolean
    showTime: boolean
    generateModel: QuestionGenerateModel
  }
}

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

const USER_STORAGE_KEY = 'user'
const USER_SETTINGS_STORAGE_KEY = 'user_settings'

const LEGACY_USER_STORAGE_KEYS = {
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

const DEFAULT_USER_SETTINGS: UserSettingsState = {
  questions: {
    showDifficulty: true,
    showTime: false,
    generateModel: 'C',
  },
}

const normalizeString = (value: unknown) => (typeof value === 'string' ? value : '')

const normalizeUserState = (value: Partial<UserState> | null | undefined): UserState => ({
  name: normalizeString(value?.name),
  user_id: normalizeString(value?.user_id),
  token: normalizeString(value?.token),
  email: normalizeString(value?.email),
  role: normalizeString(value?.role),
})

const normalizeUserSettings = (
  value: Partial<UserSettingsState> | null | undefined,
): UserSettingsState => {
  const generateModel = normalizeModelCode(value?.questions?.generateModel ?? '')

  return {
    questions: {
      showDifficulty:
        typeof value?.questions?.showDifficulty === 'boolean'
          ? value.questions.showDifficulty
          : DEFAULT_USER_SETTINGS.questions.showDifficulty,
      showTime:
        typeof value?.questions?.showTime === 'boolean'
          ? value.questions.showTime
          : DEFAULT_USER_SETTINGS.questions.showTime,
      generateModel: generateModel || DEFAULT_USER_SETTINGS.questions.generateModel,
    },
  }
}

const createDefaultUserSettings = (): UserSettingsState => ({
  questions: { ...DEFAULT_USER_SETTINGS.questions },
})

const getStorage = () => {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

const getLegacyUser = (storage: Storage): UserState | null => {
  const hasLegacyData = Object.values(LEGACY_USER_STORAGE_KEYS).some(
    (key) => storage.getItem(key) !== null,
  )

  if (!hasLegacyData) return null

  return normalizeUserState({
    name: storage.getItem(LEGACY_USER_STORAGE_KEYS.name) ?? EMPTY_USER.name,
    user_id: storage.getItem(LEGACY_USER_STORAGE_KEYS.userId) ?? EMPTY_USER.user_id,
    token: storage.getItem(LEGACY_USER_STORAGE_KEYS.token) ?? EMPTY_USER.token,
    email: storage.getItem(LEGACY_USER_STORAGE_KEYS.email) ?? EMPTY_USER.email,
    role: storage.getItem(LEGACY_USER_STORAGE_KEYS.role) ?? EMPTY_USER.role,
  })
}

const clearLegacyUser = (storage: Storage) => {
  Object.values(LEGACY_USER_STORAGE_KEYS).forEach((key) => storage.removeItem(key))
}

export const useUserStore = defineStore('user', () => {
  const storage = getStorage()
  const user = useStorage<UserState>(
    USER_STORAGE_KEY,
    normalizeUserState(EMPTY_USER),
    storage ?? undefined,
    { writeDefaults: false, mergeDefaults: true },
  )
  user.value = normalizeUserState(user.value)

  if (storage) {
    const legacyUser = getLegacyUser(storage)
    const shouldApplyLegacyUser =
      !!legacyUser && user.value.token.length === 0 && legacyUser.token.length > 0

    if (shouldApplyLegacyUser) {
      user.value = legacyUser
    }

    if (legacyUser) {
      clearLegacyUser(storage)
    }
  }

  const isAuthenticated = computed(() => user.value.token !== '')

  const role = computed(() => user.value.role)
  const email = computed(() => user.value.email)
  const name = computed(() => user.value.name)
  const userId = computed(() => user.value.user_id)
  const token = computed(() => user.value.token)

  const setUser = (next: UserState) => {
    user.value = normalizeUserState(next)
  }

  const patchUser = (partial: Partial<UserState>) => {
    user.value = normalizeUserState({
      ...user.value,
      ...partial,
    })
  }

  const clearUser = () => {
    user.value = { ...EMPTY_USER }
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
  const storage = getStorage()
  const darkMode = useDark()
  const availableModels = shallowRef<QuestionModelOption[]>([...DEFAULT_MODEL_OPTIONS])
  const isLoadingModels = ref(false)
  const hasLoadedModels = ref(false)

  const settings = useStorage<UserSettingsState>(
    USER_SETTINGS_STORAGE_KEY,
    createDefaultUserSettings(),
    storage ?? undefined,
    { mergeDefaults: true },
  )
  settings.value = normalizeUserSettings(settings.value)

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
