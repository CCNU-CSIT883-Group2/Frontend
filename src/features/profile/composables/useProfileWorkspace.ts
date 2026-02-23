/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 profile 领域的状态管理与副作用流程（模块：useProfileWorkspace）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useProfileActivityChart } from '@/features/profile/composables/profileActivityChart'
import {
  submitLogout,
  submitProfileUpdate,
} from '@/features/profile/composables/profileWorkspace.api'
import { useProfilePasswordState } from '@/features/profile/composables/profilePasswordState'
import {
  formatLastSavedAt,
  getProfileInitials,
  validateProfileEmail,
  validateProfileName,
} from '@/features/profile/composables/profileWorkspace.helpers'
import { ROUTE_NAMES } from '@/router'
import { useUserStore } from '@/stores/userStore'
import type { ProfileUpdateRequest } from '@/types'
import { useClipboard } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

/** 个人资料编辑表单的字段结构 */
interface ProfileFormState {
  name: string
  email: string
  newPassword: string
  confirmPassword: string
}

// 重新导出密码相关类型，方便组件从统一入口引入
export type {
  PasswordRuleState,
  PasswordStrengthState,
} from '@/features/profile/composables/profilePasswordState'

/**
 * 个人资料工作区核心 composable。
 *
 * 职责：
 * 1. 管理姓名、邮箱、密码三个独立的编辑/保存流程；
 * 2. 提供用户 ID 复制功能；
 * 3. 管理登出流程（后端失败时也执行本地清理）；
 * 4. 整合密码强度状态和活跃度图表。
 */
export const useProfileWorkspace = () => {
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)
  const router = useRouter()

  /** 响应式表单数据，初始值从 store 中读取 */
  const form = reactive<ProfileFormState>({
    name: user.value.name,
    email: user.value.email,
    newPassword: '',
    confirmPassword: '',
  })

  /** 各字段独立的保存状态，避免一个字段保存中阻塞其他操作 */
  const isSavingName = ref(false)
  const isSavingEmail = ref(false)
  const isSavingPassword = ref(false)
  /** 任一字段正在保存时为 true，用于全局禁用提交按钮 */
  const isSaving = computed(
    () => isSavingName.value || isSavingEmail.value || isSavingPassword.value,
  )
  /** 是否正在登出 */
  const isLoggingOut = ref(false)
  /** 是否处于密码编辑模式（展示密码输入区域） */
  const isPasswordEditing = ref(false)
  /** 操作失败时的错误提示 */
  const errorMessage = ref('')
  /** 操作成功时的成功提示 */
  const successMessage = ref('')
  /** 本次会话内最后一次保存时间（null 表示未保存过） */
  const lastSavedAt = ref<Date | null>(null)
  const { copy: copyToClipboard, isSupported: isClipboardSupported } = useClipboard()

  /** 表单中的姓名（已 trim，用于校验和提交） */
  const trimmedName = computed(() => form.name.trim())
  /** 表单中的邮箱（已 trim，用于校验和提交） */
  const trimmedEmail = computed(() => form.email.trim())

  // 展示字段：当本地 form 为空时使用占位文案
  const displayName = computed(() => trimmedName.value || 'Guest User')
  const displayEmail = computed(() => trimmedEmail.value || 'No email provided')
  const displayRole = computed(() => user.value.role || 'Member')
  const userId = computed(() => user.value.user_id)
  /** 头像区域展示的首字母缩写（最多 2 个字符） */
  const initials = computed(() => getProfileInitials(trimmedName.value, trimmedEmail.value))

  // 各字段的实时校验错误信息（空字符串表示无误）
  const nameError = computed(() => validateProfileName(trimmedName.value))
  const emailError = computed(() => validateProfileEmail(trimmedEmail.value))

  /** 是否有未保存的姓名或邮箱变更（与 store 中的值对比） */
  const hasProfileChanges = computed(
    () => trimmedName.value !== user.value.name || trimmedEmail.value !== user.value.email,
  )

  // 委托密码强度/规则/错误的计算给专用 composable
  const {
    passwordRules,
    passwordStrength,
    passwordError,
    hasPasswordInput,
    hasPasswordChanges,
    clearPasswordFields,
  } = useProfilePasswordState(form)

  /** 未保存变更的总数（个人资料 + 密码），用于 UI 提示角标 */
  const unsavedChangesCount = computed(
    () => Number(hasProfileChanges.value) + Number(hasPasswordInput.value),
  )

  /** 格式化显示的最后保存时间标签 */
  const lastSavedLabel = computed(() => formatLastSavedAt(lastSavedAt.value))

  // 活跃度图表（依赖 username，username 变化时自动重新加载）
  const { isActivityLoading, activityChartData, activityChartOptions } = useProfileActivityChart(
    computed(() => user.value.name),
  )

  /**
   * 监听 store 中 user.name / user.email 变化，自动同步到表单。
   * 仅在本地没有草稿改动时同步，避免覆盖用户正在编辑的输入。
   */
  watch(
    () => [user.value.name, user.value.email] as const,
    ([nextName, nextEmail], [previousName, previousEmail]) => {
      const hasDraftAgainstPrevious =
        form.name.trim() !== previousName || form.email.trim() !== previousEmail

      // 仅在本地没有草稿改动时同步 store，避免覆盖用户正在编辑的输入。
      if (!hasDraftAgainstPrevious) {
        form.name = nextName
        form.email = nextEmail
      }
    },
  )

  /** 同时清空错误和成功提示（每次操作前调用） */
  const clearMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
  }

  /**
   * 保存显示名称。
   * 仅在与 store 中不同时才发起请求（跳过无意义的网络请求）。
   */
  const saveName = async () => {
    clearMessages()

    if (isSavingName.value) return

    if (nameError.value) {
      errorMessage.value = nameError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: trimmedName.value !== user.value.name ? trimmedName.value : null,
      new_email: null,
      new_password: null,
    }

    // 值未变化，跳过请求
    if (!payload.new_name) return

    isSavingName.value = true

    try {
      const info = await submitProfileUpdate(payload, 'Failed to update display name.')

      // 更新 store（自动持久化）和本地 form
      userStore.patchUser({
        name: payload.new_name ?? user.value.name,
      })

      form.name = payload.new_name ?? user.value.name
      lastSavedAt.value = new Date()
      successMessage.value = info || 'Display name updated.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to update display name.'
    } finally {
      isSavingName.value = false
    }
  }

  /**
   * 保存邮箱地址。
   * 仅在与 store 中不同时才发起请求。
   */
  const saveEmail = async () => {
    clearMessages()

    if (isSavingEmail.value) return

    if (emailError.value) {
      errorMessage.value = emailError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: null,
      new_email: trimmedEmail.value !== user.value.email ? trimmedEmail.value : null,
      new_password: null,
    }

    // 值未变化，跳过请求
    if (!payload.new_email) return

    isSavingEmail.value = true

    try {
      const info = await submitProfileUpdate(payload, 'Failed to update email address.')

      userStore.patchUser({
        email: payload.new_email ?? user.value.email,
      })

      form.email = payload.new_email ?? user.value.email
      lastSavedAt.value = new Date()
      successMessage.value = info || 'Email address updated.'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to update email address.'
    } finally {
      isSavingEmail.value = false
    }
  }

  /** 进入密码编辑模式（展示密码输入区域），若正在保存中则不允许进入 */
  const startPasswordEditing = () => {
    if (isSavingPassword.value) return

    clearMessages()
    isPasswordEditing.value = true
  }

  /** 取消密码编辑，清空密码字段并关闭编辑区域 */
  const cancelPasswordEditing = () => {
    clearPasswordFields()
    isPasswordEditing.value = false
    clearMessages()
  }

  /**
   * 保存新密码。
   * 需先通过密码输入和强度校验，再发起请求；成功后自动关闭编辑模式。
   */
  const savePassword = async () => {
    clearMessages()

    if (isSavingPassword.value || !isPasswordEditing.value) return

    if (!hasPasswordInput.value) {
      errorMessage.value = 'Please enter and confirm your new password.'
      return
    }

    if (passwordError.value) {
      errorMessage.value = passwordError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: null,
      new_email: null,
      new_password: form.newPassword,
    }

    isSavingPassword.value = true

    try {
      const info = await submitProfileUpdate(payload, 'Failed to update password.')

      clearPasswordFields()
      isPasswordEditing.value = false
      lastSavedAt.value = new Date()
      successMessage.value = info || 'Password updated successfully.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to update password.'
    } finally {
      isSavingPassword.value = false
    }
  }

  /**
   * 将当前用户 ID 复制到剪贴板。
   * 在不支持 Clipboard API 或 userId 为空时给出相应提示。
   */
  const copyUserId = async () => {
    clearMessages()

    const currentUserId = user.value.user_id?.trim()
    if (!currentUserId) {
      errorMessage.value = 'User ID is unavailable.'
      return
    }

    if (!isClipboardSupported.value) {
      errorMessage.value = 'Clipboard is not available in this browser.'
      return
    }

    try {
      await copyToClipboard(currentUserId)
      successMessage.value = 'User ID copied to clipboard.'
    } catch {
      errorMessage.value = 'Unable to copy User ID.'
    }
  }

  /**
   * 执行登出：
   * 1. 调用后端 /logout 接口（通知服务端失效 token）；
   * 2. 无论后端是否成功，均清理本地 store 并跳转到登录页；
   *    防止因后端接口异常导致用户无法退出。
   */
  const logout = async () => {
    isLoggingOut.value = true
    clearMessages()

    try {
      await submitLogout()
    } catch {
      // 后端登出失败也继续本地清理，避免用户停留在"伪登录"状态。
    } finally {
      userStore.clearUser()
      isLoggingOut.value = false
      await router.push({ name: ROUTE_NAMES.login })
    }
  }

  return {
    form,
    isSaving,
    isSavingName,
    isSavingEmail,
    isSavingPassword,
    isLoggingOut,
    isPasswordEditing,
    isActivityLoading,
    errorMessage,
    successMessage,
    displayName,
    displayEmail,
    displayRole,
    userId,
    initials,
    nameError,
    emailError,
    hasProfileChanges,
    hasPasswordInput,
    hasPasswordChanges,
    passwordRules,
    passwordStrength,
    passwordError,
    unsavedChangesCount,
    lastSavedLabel,
    activityChartData,
    activityChartOptions,
    saveName,
    saveEmail,
    startPasswordEditing,
    cancelPasswordEditing,
    savePassword,
    copyUserId,
    logout,
  }
}
