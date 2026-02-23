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

/** 包含密码输入字段的表单片段（由外部传入，不持有全部表单状态） */
interface PasswordFormState {
  newPassword: string
  confirmPassword: string
}

/** 密码规则检查项的状态（用于 UI 渲染校验清单） */
export interface PasswordRuleState {
  /** 规则唯一标识，用作 v-for key */
  key: string
  /** 展示给用户的规则描述 */
  label: string
  /** 当前密码是否已满足此规则 */
  passed: boolean
}

/** 密码强度指示器的完整状态 */
export interface PasswordStrengthState {
  /** 强度文字标签，如 "Strong" */
  label: string
  /** 强度数值（0-100），用于控制进度条宽度 */
  value: number
  /** Tailwind 背景色类名，用于控制进度条颜色 */
  barClass: string
  /** 对用户的辅助描述文字 */
  description: string
}

/** 特殊字符校验的正则表达式 */
const PASSWORD_SPECIAL_PATTERN = /[!@#$%^&*(),.?":{}|<>]/

/**
 * 密码修改表单的状态 composable。
 *
 * 接收外部传入的 form（reactive）对象，计算：
 * 1. 各项密码规则的通过状态（用于展示校验清单）；
 * 2. 密码强度等级和描述；
 * 3. 综合错误信息（表单提交前的最终校验）；
 * 4. 辅助状态（hasPasswordInput、hasPasswordChanges）。
 */
export const useProfilePasswordState = (form: PasswordFormState) => {
  /**
   * 密码强度规则列表（动态 computed，随输入实时更新）。
   * 共 4 条规则，每条满足时 passed=true，用于渲染绿色勾选图标。
   */
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

  /** 当前满足的规则数量（0-4），用于计算密码强度等级 */
  const passwordScore = computed(() => passwordRules.value.filter((rule) => rule.passed).length)

  /** 两个密码字段中任意一个有输入，即视为"正在修改密码" */
  const hasPasswordInput = computed(
    () => form.newPassword.length > 0 || form.confirmPassword.length > 0,
  )

  /**
   * 确认密码框有输入时，才判断两次是否不一致。
   * 避免用户刚开始输入就立即展示不匹配错误。
   */
  const passwordMismatch = computed(
    () => form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword,
  )

  /**
   * 密码强度等级：
   * - score 0-1 → Weak（红）
   * - score 2   → Fair（橙）
   * - score 3   → Good（蓝）
   * - score 4   → Strong（绿）
   */
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

  /**
   * 综合密码错误信息（用于提交时展示）：
   * - 未输入时返回空字符串（不提前报错）；
   * - 任一字段为空 → 提示填写两个字段；
   * - 两次不一致 → 提示不匹配；
   * - 强度不足 → 提示需要增强。
   */
  const passwordError = computed(() => {
    if (!hasPasswordInput.value) return ''
    if (!form.newPassword || !form.confirmPassword) return 'Please fill in both password fields.'
    if (passwordMismatch.value) return 'Passwords do not match.'
    if (passwordScore.value < 3) return 'Password is too weak. Improve it before saving.'
    return ''
  })

  /** 只有有输入且无错误时，才视为"有有效的密码变更"（用于控制保存按钮状态） */
  const hasPasswordChanges = computed(() => hasPasswordInput.value && !passwordError.value)

  /** 清空两个密码字段（取消编辑或保存成功后调用） */
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
