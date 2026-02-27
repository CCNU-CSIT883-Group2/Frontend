/**
 * 文件说明（是什么）：
 * - 本文件是「Store 辅助函数模块」。
 * - 提供 Store 所需的纯函数与转换逻辑（模块：userStore.helpers）。
 *
 * 设计原因（为什么）：
 * - 把可复用计算从状态容器中拆分，降低耦合并提升可测试性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

/** 存储在 Pinia / localStorage 中的用户身份信息结构 */
export interface UserState {
  name: string
  user_id: string
  token: string
  email: string
  role: string
}

/** AI 模型代码类型，例如 'C'（ChatGPT）、'K'（Kimi） */
export type QuestionGenerateModel = string

/** 用户偏好设置的持久化结构 */
export interface UserSettingsState {
  questions: {
    /** 是否在题目列表中显示难度标签 */
    showDifficulty: boolean
    /** 是否在题目列表中显示建议用时 */
    showTime: boolean
    /** 当前选择的 AI 生成模型代码 */
    generateModel: QuestionGenerateModel
  }
}

/** 后端 /models 接口返回的数据结构 */
export interface ModelsData {
  name: string
  /** 后端支持的模型代码列表，原始字符串，需经 normalizeModelCode 规范化 */
  models: string[]
}

/** 下拉选择框中展示的模型选项 */
export interface QuestionModelOption {
  /** 用户可读的模型名称，如 "ChatGPT" */
  label: string
  /** 发送给后端的模型代码，如 "C" */
  value: QuestionGenerateModel
}

/** 模型代码到用户可读名称的映射表 */
const MODEL_LABEL_BY_CODE: Record<string, string> = {
  C: 'ChatGPT',
  K: 'Kimi',
  D: 'Doubao',
  T: 'Test',
  G: 'GLM',
}

/**
 * 别名到标准模型代码的映射表。
 * 同时支持短码（如 "C"）和全名（如 "CHATGPT"），统一归一化为单字母标准码。
 */
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

/** 未从后端加载到可用模型列表时的内置兜底选项 */
export const DEFAULT_MODEL_OPTIONS: QuestionModelOption[] = [
  { label: MODEL_LABEL_BY_CODE.C ?? 'ChatGPT', value: 'C' },
  { label: MODEL_LABEL_BY_CODE.K ?? 'Kimi', value: 'K' },
]

/**
 * 将原始模型字符串规范化为标准单字母代码。
 * 支持大小写不敏感匹配，未知代码直接原样返回。
 */
export const normalizeModelCode = (rawModel: string) => {
  const normalized = rawModel.trim().toUpperCase()
  if (!normalized) return ''
  return MODEL_CODE_BY_ALIAS[normalized] ?? normalized
}

/** 将标准模型代码转换为下拉选项对象，未知代码以代码本身作为标签 */
export const toQuestionModelOption = (modelCode: string): QuestionModelOption => ({
  value: modelCode,
  label: MODEL_LABEL_BY_CODE[modelCode] ?? modelCode,
})

/**
 * 批量规范化模型代码列表。
 * 先逐项调用 normalizeModelCode，再去重、过滤空值。
 */
export const normalizeModelCodes = (rawModels: string[]) =>
  Array.from(new Set(rawModels.map(normalizeModelCode).filter(Boolean)))

/** localStorage 中用户身份信息的存储键 */
export const USER_STORAGE_KEY = 'user'
/** localStorage 中用户偏好设置的存储键 */
export const USER_SETTINGS_STORAGE_KEY = 'user_settings'

/**
 * 旧版（迁移前）各字段分散存储时使用的 localStorage 键名映射。
 * 用于首次加载时将旧数据迁移至新的统一存储键。
 */
const LEGACY_USER_STORAGE_KEYS = {
  name: 'username',
  userId: 'user_id',
  token: 'token',
  email: 'email',
  role: 'role',
} as const

/** 未登录状态下的空用户对象，所有字段为空字符串 */
export const EMPTY_USER: UserState = {
  name: '',
  user_id: '',
  token: '',
  email: '',
  role: '',
}

/** 用户偏好设置的默认值 */
export const DEFAULT_USER_SETTINGS: UserSettingsState = {
  questions: {
    showDifficulty: true,
    showTime: false,
    generateModel: 'C',
  },
}

/** 将任意值安全转换为字符串，非字符串类型返回空字符串 */
const normalizeString = (value: unknown) => (typeof value === 'string' ? value : '')

/**
 * 将来自 localStorage 的原始用户数据规范化为完整的 UserState。
 * 防御 null / undefined / 字段缺失等异常情况。
 */
export const normalizeUserState = (value: Partial<UserState> | null | undefined): UserState => ({
  name: normalizeString(value?.name),
  user_id: normalizeString(value?.user_id),
  token: normalizeString(value?.token),
  email: normalizeString(value?.email),
  role: normalizeString(value?.role),
})

/**
 * 将来自 localStorage 的原始设置数据规范化为完整的 UserSettingsState。
 * 对 boolean 字段做类型守卫，对模型代码做归一化处理，缺失时使用默认值。
 */
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
      // 规范化后若为空字符串，回退到默认模型代码
      generateModel: generateModel || DEFAULT_USER_SETTINGS.questions.generateModel,
    },
  }
}

/** 创建一份全新的默认用户设置（避免多处共享同一个引用） */
export const createDefaultUserSettings = (): UserSettingsState => ({
  questions: { ...DEFAULT_USER_SETTINGS.questions },
})

/**
 * 安全获取 localStorage 实例。
 * SSR 环境或浏览器禁用 storage 时返回 null。
 */
export const getStorage = () => {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * 从 localStorage 读取旧版分散存储的用户数据。
 * 若任何旧键存在则尝试重建 UserState，否则返回 null。
 */
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

/** 清除 localStorage 中所有旧版分散存储的用户字段，完成迁移后调用 */
export const clearLegacyUser = (storage: Storage) => {
  Object.values(LEGACY_USER_STORAGE_KEYS).forEach((key) => storage.removeItem(key))
}
