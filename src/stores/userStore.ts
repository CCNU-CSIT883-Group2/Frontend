/**
 * 文件说明（是什么）：
 * - 本文件是「Pinia 状态仓库模块」。
 * - 管理全局/跨组件状态与相关动作（模块：userStore）。
 *
 * 设计原因（为什么）：
 * - 集中维护状态变更入口，防止状态修改分散造成数据不一致。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import {
  DEFAULT_MODEL_OPTIONS,
  EMPTY_USER,
  USER_SETTINGS_STORAGE_KEY,
  USER_STORAGE_KEY,
  clearLegacyUser,
  createDefaultUserSettings,
  getLegacyUser,
  getStorage,
  normalizeModelCode,
  normalizeModelCodes,
  normalizeUserSettings,
  normalizeUserState,
  toQuestionModelOption,
  type ModelsData,
  type QuestionModelOption,
  type UserSettingsState,
  type UserState,
} from '@/stores/userStore.helpers'
import type { Response } from '@/types'
import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { useDark, useStorage } from '@vueuse/core'

/**
 * 用户身份仓库：管理登录状态、token 及用户基本信息。
 * 数据通过 vueuse/useStorage 自动持久化到 localStorage。
 */
export const useUserStore = defineStore('user', () => {
  // 获取 localStorage 实例，SSR 或权限异常时为 null
  const storage = getStorage()

  // 用 useStorage 将用户状态与 localStorage 双向同步
  const user = useStorage<UserState>(
    USER_STORAGE_KEY,
    normalizeUserState(EMPTY_USER),
    storage ?? undefined,
    { writeDefaults: false, mergeDefaults: true }, // mergeDefaults 确保新增字段有默认值
  )
  // 首次读取后立即规范化，防御旧版/损坏数据
  user.value = normalizeUserState(user.value)

  if (storage) {
    // 检测旧版分散存储的用户数据（迁移前格式）
    const legacyUser = getLegacyUser(storage)
    // 只有在当前 token 为空且旧数据有 token 时才迁移，避免覆盖已登录状态
    const shouldApplyLegacyUser =
      !!legacyUser && user.value.token.length === 0 && legacyUser.token.length > 0

    if (shouldApplyLegacyUser) {
      user.value = legacyUser
    }

    // 无论是否迁移，都清理旧键以保持 storage 整洁
    if (legacyUser) {
      clearLegacyUser(storage)
    }
  }

  /** 是否已登录（token 非空即视为已认证） */
  const isAuthenticated = computed(() => user.value.token !== '')

  // 派生属性：将 user 对象的各字段解构为独立 computed，供组件直接解构使用
  const role = computed(() => user.value.role)
  const email = computed(() => user.value.email)
  const name = computed(() => user.value.name)
  const userId = computed(() => user.value.user_id)
  const token = computed(() => user.value.token)

  /** 全量替换用户状态（登录成功时调用） */
  const setUser = (next: UserState) => {
    user.value = normalizeUserState(next)
  }

  /** 局部更新用户状态（修改昵称/邮箱等单字段时调用） */
  const patchUser = (partial: Partial<UserState>) => {
    user.value = normalizeUserState({
      ...user.value,
      ...partial,
    })
  }

  /** 清空用户状态（退出登录时调用） */
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

/**
 * 用户偏好设置仓库：管理深色模式、题目面板显示选项及 AI 模型选择。
 * 与 userStore 分离，职责更单一，避免频繁更新污染身份状态。
 */
export const useUserSettingsStore = defineStore('userSettings', () => {
  const storage = getStorage()

  // vueuse useDark 自动在 <html> 上切换 .dark 类名，与 Tailwind 暗色方案对接
  const darkMode = useDark()

  // 可用模型列表，初始为内置兜底列表，待后端接口返回后动态替换
  const availableModels = shallowRef<QuestionModelOption[]>([...DEFAULT_MODEL_OPTIONS])
  /** 是否正在请求模型列表 */
  const isLoadingModels = ref(false)
  /** 是否已成功从后端加载过模型列表 */
  const hasLoadedModels = ref(false)

  // 用户偏好设置持久化到 localStorage
  const settings = useStorage<UserSettingsState>(
    USER_SETTINGS_STORAGE_KEY,
    createDefaultUserSettings(),
    storage ?? undefined,
    { mergeDefaults: true },
  )
  // 首次读取后规范化，防御字段缺失或类型异常
  settings.value = normalizeUserSettings(settings.value)

  /** 设置深色模式开关（幂等：值相同时跳过） */
  const setDarkMode = (next: boolean) => {
    if (darkMode.value === next) return
    darkMode.value = next
  }

  /** 切换深色/浅色模式 */
  const toggleDarkMode = () => {
    setDarkMode(!darkMode.value)
  }

  /**
   * 校验当前选中的模型代码是否在可用列表中。
   * 若不存在（如后端删除了该模型），自动回退到列表第一项。
   */
  const ensureSelectedModel = () => {
    const selectedModel = normalizeModelCode(settings.value.questions.generateModel)
    const availableModelSet = new Set(availableModels.value.map((option) => option.value))

    if (selectedModel && availableModelSet.has(selectedModel)) {
      settings.value.questions.generateModel = selectedModel
      return
    }

    // 当前选中模型不可用，回退到第一个可用模型；若列表为空则使用硬编码默认值
    settings.value.questions.generateModel = availableModels.value[0]?.value ?? 'C'
  }

  /**
   * 用后端返回的模型列表更新可用模型。
   * 若列表为空则保留内置兜底列表，并重置 hasLoadedModels。
   */
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

  /**
   * 异步从后端加载可用模型列表。
   * - force=false 时已加载过则跳过网络请求；
   * - 请求失败时静默处理，保持现有列表不变。
   */
  const loadAvailableModels = async (force = false) => {
    // 防止并发重复请求
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
      // 网络错误时静默回退，不影响用户继续使用默认模型
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
