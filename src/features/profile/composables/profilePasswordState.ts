/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 profile 领域的计算、共享与适配能力（模块：profilePasswordState）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { computed } from 'vue'

interface PasswordFormState {
  newPassword: string
  confirmPassword: string
}

export interface PasswordRuleState {
  key: string
  label: string
  passed: boolean
}

export interface PasswordStrengthState {
  label: string
  value: number
  barClass: string
  description: string
}

const PASSWORD_SPECIAL_PATTERN = /[!@#$%^&*(),.?":{}|<>]/

export const useProfilePasswordState = (form: PasswordFormState) => {
  const passwordRules = computed<PasswordRuleState[]>(() => [
    {
      key: 'length',
      label: 'At least 8 characters',
      passed: form.newPassword.length >= 8,
    },
    {
      key: 'uppercase',
      label: 'Contains an uppercase letter',
      passed: /[A-Z]/.test(form.newPassword),
    },
    {
      key: 'number',
      label: 'Contains a number',
      passed: /[0-9]/.test(form.newPassword),
    },
    {
      key: 'special',
      label: 'Contains a special symbol',
      passed: PASSWORD_SPECIAL_PATTERN.test(form.newPassword),
    },
  ])

  const passwordScore = computed(() => passwordRules.value.filter((rule) => rule.passed).length)
  const hasPasswordInput = computed(
    () => form.newPassword.length > 0 || form.confirmPassword.length > 0,
  )
  const passwordMismatch = computed(
    () => form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword,
  )

  const passwordStrength = computed<PasswordStrengthState>(() => {
    if (passwordScore.value <= 1) {
      return {
        label: 'Weak',
        value: 25,
        barClass: 'bg-red-500',
        description: 'Too easy to guess. Add more complexity.',
      }
    }

    if (passwordScore.value === 2) {
      return {
        label: 'Fair',
        value: 50,
        barClass: 'bg-orange-500',
        description: 'Needs stronger character variety.',
      }
    }

    if (passwordScore.value === 3) {
      return {
        label: 'Good',
        value: 75,
        barClass: 'bg-blue-500',
        description: 'Good baseline for a secure password.',
      }
    }

    return {
      label: 'Strong',
      value: 100,
      barClass: 'bg-emerald-500',
      description: 'Strong password quality.',
    }
  })

  const passwordError = computed(() => {
    if (!hasPasswordInput.value) return ''
    if (!form.newPassword || !form.confirmPassword) return 'Please fill in both password fields.'
    if (passwordMismatch.value) return 'Passwords do not match.'
    if (passwordScore.value < 3) return 'Password is too weak. Improve it before saving.'
    return ''
  })

  const hasPasswordChanges = computed(() => hasPasswordInput.value && !passwordError.value)

  const clearPasswordFields = () => {
    form.newPassword = ''
    form.confirmPassword = ''
  }

  return {
    passwordRules,
    passwordStrength,
    passwordError,
    hasPasswordInput,
    hasPasswordChanges,
    clearPasswordFields,
  }
}
