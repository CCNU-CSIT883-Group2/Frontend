/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 auth 领域的状态管理与副作用流程（模块：useRegisterForm）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import { ROUTE_NAMES } from '@/router'
import type { RegisterResponse } from '@/types'
import { useTimeoutFn } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

type UserRole = 'teacher' | 'student'

interface RegisterForm {
  role: UserRole
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface PasswordStrengthState {
  width: string
  color: string
  label: string
}

const roles: Array<{ label: string; value: UserRole }> = [
  { label: 'Teacher', value: 'teacher' },
  { label: 'Student', value: 'student' },
]

export const useRegisterForm = () => {
  const form = reactive<RegisterForm>({
    role: 'student',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const isTermsAccepted = ref(false)
  const isTermsDialogVisible = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  const router = useRouter()
  const { start: startRedirect, stop: stopRedirect } = useTimeoutFn(
    () => {
      void router.push({ name: ROUTE_NAMES.login })
    },
    600,
    { immediate: false },
  )

  const passwordMismatch = computed(() => form.password !== form.confirmPassword)

  const passwordStrength = computed<PasswordStrengthState>(() => {
    let score = 0
    if (form.password.length >= 8) score += 1
    if (/[0-9]/.test(form.password)) score += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) score += 1
    if (/[a-z]/.test(form.password) && /[A-Z]/.test(form.password)) score += 1

    if (score <= 1) return { width: '25%', color: 'bg-red-500', label: 'Weak' }
    if (score === 2) return { width: '50%', color: 'bg-orange-500', label: 'Fair' }
    if (score === 3) return { width: '75%', color: 'bg-blue-500', label: 'Good' }
    return { width: '100%', color: 'bg-green-500', label: 'Strong' }
  })

  const canSubmit = computed(() => {
    return (
      form.name.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      !passwordMismatch.value &&
      isTermsAccepted.value
    )
  })

  const agreeTerms = () => {
    isTermsAccepted.value = true
    isTermsDialogVisible.value = false
  }

  const goToLogin = () => {
    void router.push({ name: ROUTE_NAMES.login })
  }

  const handleRegister = async () => {
    if (!canSubmit.value) {
      errorMessage.value = 'Please complete all required fields and accept the terms'
      successMessage.value = ''
      return
    }

    isSubmitting.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await axios.post<RegisterResponse>('/register', {
        name: form.name.trim(),
        password: form.password,
        email: form.email.trim(),
        role: form.role,
      })

      if (response.data.code !== 200 || !response.data.user) {
        throw new Error(response.data.info || 'Registration failed')
      }

      successMessage.value = response.data.info || 'Registration successful'
      stopRedirect()
      startRedirect()
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Registration failed'
      successMessage.value = ''
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    roles,
    form,
    isTermsAccepted,
    isTermsDialogVisible,
    isSubmitting,
    errorMessage,
    successMessage,
    passwordMismatch,
    passwordStrength,
    canSubmit,
    agreeTerms,
    goToLogin,
    handleRegister,
  }
}
