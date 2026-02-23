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

/** 用户角色类型，对应后端字段 */
type UserRole = 'teacher' | 'student'

/** 注册表单字段结构 */
interface RegisterForm {
  role: UserRole
  name: string
  email: string
  password: string
  confirmPassword: string
}

/** 密码强度指示器的 UI 状态 */
interface PasswordStrengthState {
  /** 强度条宽度百分比，如 "50%" */
  width: string
  /** Tailwind 背景色类名，如 "bg-green-500" */
  color: string
  /** 强度文本标签，如 "Strong" */
  label: string
}

/** 角色选项列表，用于下拉选择框 */
const roles: Array<{ label: string; value: UserRole }> = [
  { label: 'Teacher', value: 'teacher' },
  { label: 'Student', value: 'student' },
]

/**
 * 注册页逻辑 composable。
 * 管理表单状态、密码强度计算、服务条款弹窗、提交校验及注册后的跳转。
 */
export const useRegisterForm = () => {
  /** 响应式表单数据，与模板输入框双向绑定 */
  const form = reactive<RegisterForm>({
    role: 'student',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  /** 用户是否已同意服务条款 */
  const isTermsAccepted = ref(false)
  /** 服务条款弹窗是否可见 */
  const isTermsDialogVisible = ref(false)
  /** 是否正在提交注册请求 */
  const isSubmitting = ref(false)
  /** 注册失败时的错误提示文案 */
  const errorMessage = ref('')
  /** 注册成功时的提示文案 */
  const successMessage = ref('')

  const router = useRouter()

  /**
   * 注册成功后的跳转延时器：600ms 后自动跳转到登录页。
   * 使用 stop/start 可取消重复触发。
   */
  const { start: startRedirect, stop: stopRedirect } = useTimeoutFn(
    () => {
      void router.push({ name: ROUTE_NAMES.login })
    },
    600,
    { immediate: false },
  )

  /**
   * 两次密码是否不一致。
   * 注意：此处不加"两者均非空"的保护，让确认密码框一旦有值就即时反馈。
   */
  const passwordMismatch = computed(() => form.password !== form.confirmPassword)

  /**
   * 密码强度计算：
   * - 长度 ≥ 8：+1 分
   * - 含数字：+1 分
   * - 含特殊字符：+1 分
   * - 同时含大小写字母：+1 分
   * 总分 0-1 → Weak；2 → Fair；3 → Good；4 → Strong
   */
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

  /**
   * 表单是否可提交：
   * 所有字段非空 + 两次密码一致 + 已同意条款。
   * 用于控制提交按钮的 disabled 状态。
   */
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

  /** 用户在弹窗中同意条款：标记已同意并关闭弹窗 */
  const agreeTerms = () => {
    isTermsAccepted.value = true
    isTermsDialogVisible.value = false
  }

  /** 跳转到登录页 */
  const goToLogin = () => {
    void router.push({ name: ROUTE_NAMES.login })
  }

  /**
   * 处理注册提交：
   * 1. canSubmit 守卫（防止绕过 disabled 的非常规提交）；
   * 2. 调用 /register 接口；
   * 3. 成功时展示提示并延时跳转登录页；
   * 4. 失败时展示后端或通用错误信息。
   */
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

      // 后端可能在 code 非 200 或 user 为空时仍返回 2xx HTTP 状态码，需显式校验
      if (response.data.code !== 200 || !response.data.user) {
        throw new Error(response.data.info || 'Registration failed')
      }

      successMessage.value = response.data.info || 'Registration successful'
      // 先 stop 再 start，防止连续点击叠加多次跳转
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
