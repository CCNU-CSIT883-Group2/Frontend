import { ROUTE_NAMES } from '@/router'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

export const usePasswordRecovery = () => {
  const email = ref('')
  const verificationCode = ref('')
  const countdown = ref(0)
  const isSending = ref(false)
  const isRecovering = ref(true)
  const newPassword = ref('')
  const confirmPassword = ref('')
  const isNewPasswordVisible = ref(false)
  const isConfirmPasswordVisible = ref(false)
  const statusMessage = ref('')
  const statusMessageSeverity = ref<'success' | 'error' | 'info'>('info')

  const router = useRouter()

  const passwordMismatch = computed(
    () =>
      !!newPassword.value &&
      !!confirmPassword.value &&
      newPassword.value !== confirmPassword.value,
  )

  const passwordStrength = computed(() => {
    if (newPassword.value.length < 6) return 'Weak'
    if (newPassword.value.length < 10) return 'Medium'
    return 'Strong'
  })

  const clearMessage = () => {
    statusMessage.value = ''
  }

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

  const { start: startRedirect, stop: stopRedirect } = useTimeoutFn(
    () => {
      void router.push({ name: ROUTE_NAMES.login })
    },
    500,
    { immediate: false },
  )

  const startCountdown = () => {
    countdown.value = 60
    isSending.value = true
    pauseCountdown()
    resumeCountdown()
  }

  const sendVerificationCode = () => {
    if (!email.value.trim() || isSending.value) return

    clearMessage()
    startCountdown()

    // Mock behavior only: backend integration is intentionally out of scope.
    statusMessageSeverity.value = 'success'
    statusMessage.value = `Verification code sent to ${email.value.trim()}`
  }

  const verifyCode = () => {
    clearMessage()

    if (verificationCode.value.trim() !== '123456') {
      statusMessageSeverity.value = 'error'
      statusMessage.value = 'Invalid verification code.'
      return
    }

    statusMessageSeverity.value = 'success'
    statusMessage.value = 'Verification succeeded. Please set a new password.'
    isRecovering.value = false
  }

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
