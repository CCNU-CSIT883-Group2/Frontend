/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 auth 领域的状态管理与副作用流程（模块：usePasswordRecovery）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { ROUTE_NAMES } from '@/router'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * 密码找回页逻辑 composable。
 *
 * 页面分为两个阶段：
 * 1. 验证码阶段（isRecovering=true）：输入邮箱 → 发送验证码 → 验证；
 * 2. 重置密码阶段（isRecovering=false）：输入并确认新密码 → 提交。
 *
 * 注意：后端接入尚未实现，当前为 Mock 行为（固定验证码 "123456"）。
 */
export const usePasswordRecovery = () => {
  /** 用户输入的邮箱地址 */
  const email = ref('')
  /** 用户输入的验证码 */
  const verificationCode = ref('')
  /** 验证码发送后的倒计时秒数（为 0 时允许重新发送） */
  const countdown = ref(0)
  /** 是否正在发送验证码（倒计时期间为 true，同时禁用"发送"按钮） */
  const isSending = ref(false)
  /** 当前是否处于"验证邮箱"阶段（false 表示进入"设置新密码"阶段） */
  const isRecovering = ref(true)
  /** 新密码输入框的值 */
  const newPassword = ref('')
  /** 确认密码输入框的值 */
  const confirmPassword = ref('')
  /** 新密码输入框是否以明文显示 */
  const isNewPasswordVisible = ref(false)
  /** 确认密码输入框是否以明文显示 */
  const isConfirmPasswordVisible = ref(false)
  /** 操作反馈信息（成功/失败/提示文案） */
  const statusMessage = ref('')
  /** 反馈信息的语义色调，对应 PrimeVue Message 组件的 severity */
  const statusMessageSeverity = ref<'success' | 'error' | 'info'>('info')

  const router = useRouter()

  /** 两次密码是否不一致（仅在两个字段均非空时才触发） */
  const passwordMismatch = computed(
    () =>
      !!newPassword.value &&
      !!confirmPassword.value &&
      newPassword.value !== confirmPassword.value,
  )

  /** 密码强度评估（基于长度，仅用于简单 UI 提示） */
  const passwordStrength = computed(() => {
    if (newPassword.value.length < 6) return 'Weak'
    if (newPassword.value.length < 10) return 'Medium'
    return 'Strong'
  })

  /** 清空当前反馈信息 */
  const clearMessage = () => {
    statusMessage.value = ''
  }

  /**
   * 倒计时定时器：每秒递减 countdown，归零时停止并允许重新发送。
   * immediate: false 表示不立即启动，由 startCountdown 手动触发。
   */
  const { pause: pauseCountdown, resume: resumeCountdown } = useIntervalFn(
    () => {
      if (countdown.value <= 1) {
        countdown.value = 0
        isSending.value = false
        pauseCountdown()
        return
      }

      countdown.value -= 1
    },
    1000,
    { immediate: false },
  )

  /**
   * 重置成功后的跳转延时器：500ms 后自动导航到登录页。
   * 使用 stop/start 可在提交前取消上一次的跳转计划。
   */
  const { start: startRedirect, stop: stopRedirect } = useTimeoutFn(
    () => {
      void router.push({ name: ROUTE_NAMES.login })
    },
    500,
    { immediate: false },
  )

  /**
   * 启动 60 秒倒计时。
   * 调用前先 pause 确保上一次定时器已停止（防止多次点击叠加）。
   */
  const startCountdown = () => {
    countdown.value = 60
    isSending.value = true
    pauseCountdown()
    resumeCountdown()
  }

  /**
   * 发送验证码。
   * Mock 行为：不调用后端，仅启动倒计时并展示成功提示。
   * 邮箱为空或倒计时中时不允许发送。
   */
  const sendVerificationCode = () => {
    if (!email.value.trim() || isSending.value) return

    clearMessage()
    startCountdown()

    // Mock behavior only: backend integration is intentionally out of scope.
    statusMessageSeverity.value = 'success'
    statusMessage.value = `Verification code sent to ${email.value.trim()}`
  }

  /**
   * 验证验证码。
   * Mock 行为：固定接受 "123456"，验证通过后切换到设置新密码阶段。
   */
  const verifyCode = () => {
    clearMessage()

    if (verificationCode.value.trim() !== '123456') {
      statusMessageSeverity.value = 'error'
      statusMessage.value = 'Invalid verification code.'
      return
    }

    statusMessageSeverity.value = 'success'
    statusMessage.value = 'Verification succeeded. Please set a new password.'
    // 切换到重置密码阶段
    isRecovering.value = false
  }

  /**
   * 提交新密码。
   * 校验两次密码一致且非空后，Mock 成功并延时跳转登录页。
   */
  const confirmModification = () => {
    clearMessage()

    if (passwordMismatch.value) {
      statusMessageSeverity.value = 'error'
      statusMessage.value = 'Passwords do not match.'
      return
    }

    if (!newPassword.value) {
      statusMessageSeverity.value = 'error'
      statusMessage.value = 'Please enter a new password.'
      return
    }

    // Mock behavior only: backend integration is intentionally out of scope.
    statusMessageSeverity.value = 'success'
    statusMessage.value = 'Password reset completed. Redirecting to login...'

    // 先 stop 再 start，防止连续点击触发多次跳转
    stopRedirect()
    startRedirect()
  }

  return {
    email,
    verificationCode,
    countdown,
    isSending,
    isRecovering,
    newPassword,
    confirmPassword,
    isNewPasswordVisible,
    isConfirmPasswordVisible,
    statusMessage,
    statusMessageSeverity,
    passwordMismatch,
    passwordStrength,
    sendVerificationCode,
    verifyCode,
    confirmModification,
  }
}
