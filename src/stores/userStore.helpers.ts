/**
 * 文件说明（是什么）：
 * - 本文件是「Store 辅助函数模块」。
 * - 提供 Store 所需的纯函数与转换逻辑（模块：userStore.helpers）。
 *
 * 设计原因（为什么）：
 * - 把可复用计算从状态容器中拆分，降低耦合并提升可测试性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

export interface UserState {
  name: string
  user_id: string
  token: string
  email: string
  role: string
}

export type QuestionGenerateModel = string

export interface UserSettingsState {
  questions: {
    showDifficulty: boolean
    showTime: boolean
    generateModel: QuestionGenerateModel
  }
}

export interface ModelsData {
  name: string
  models: string[]
}

export interface QuestionModelOption {
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

export const DEFAULT_MODEL_OPTIONS: QuestionModelOption[] = [
  { label: MODEL_LABEL_BY_CODE.C, value: 'C' },
  { label: MODEL_LABEL_BY_CODE.K, value: 'K' },
]

export const normalizeModelCode = (rawModel: string) => {
  const normalized = rawModel.trim().toUpperCase()
  if (!normalized) return ''
  return MODEL_CODE_BY_ALIAS[normalized] ?? normalized
}

export const toQuestionModelOption = (modelCode: string): QuestionModelOption => ({
  value: modelCode,
  label: MODEL_LABEL_BY_CODE[modelCode] ?? modelCode,
})

export const normalizeModelCodes = (rawModels: string[]) =>
  Array.from(new Set(rawModels.map(normalizeModelCode).filter(Boolean)))

export const USER_STORAGE_KEY = 'user'
export const USER_SETTINGS_STORAGE_KEY = 'user_settings'

const LEGACY_USER_STORAGE_KEYS = {
  name: 'username',
  userId: 'user_id',
  token: 'token',
  email: 'email',
  role: 'role',
} as const

export const EMPTY_USER: UserState = {
  name: '',
  user_id: '',
  token: '',
  email: '',
  role: '',
}

export const DEFAULT_USER_SETTINGS: UserSettingsState = {
  questions: {
    showDifficulty: true,
    showTime: false,
    generateModel: 'C',
  },
}

const normalizeString = (value: unknown) => (typeof value === 'string' ? value : '')

export const normalizeUserState = (value: Partial<UserState> | null | undefined): UserState => ({
  name: normalizeString(value?.name),
  user_id: normalizeString(value?.user_id),
  token: normalizeString(value?.token),
  email: normalizeString(value?.email),
  role: normalizeString(value?.role),
})

export const normalizeUserSettings = (
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

export const createDefaultUserSettings = (): UserSettingsState => ({
  questions: { ...DEFAULT_USER_SETTINGS.questions },
})

export const getStorage = () => {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export const getLegacyUser = (storage: Storage): UserState | null => {
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

export const clearLegacyUser = (storage: Storage) => {
  Object.values(LEGACY_USER_STORAGE_KEYS).forEach((key) => storage.removeItem(key))
}
