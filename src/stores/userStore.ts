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
