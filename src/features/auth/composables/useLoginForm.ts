/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 auth 领域的状态管理与副作用流程（模块：useLoginForm）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import { ROUTE_NAMES } from '@/router'
import { useUserSettingsStore, useUserStore } from '@/stores/userStore'
import type { LoginData, Response } from '@/types'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** 登录表单字段结构 */
interface LoginForm {
  name: string
  password: string
}

/**
 * 登录页逻辑 composable。
 * 管理表单双向绑定、提交状态、错误展示，以及登录成功后的跳转逻辑。
 */
export const useLoginForm = () => {
  /** 响应式表单数据，与模板输入框双向绑定 */
  const form = reactive<LoginForm>({
    name: '',
    password: '',
  })

  /** 是否正在提交（用于禁用按钮、展示加载动画） */
  const isSubmitting = ref(false)
  /** 登录失败时展示的错误提示信息 */
  const errorMessage = ref('')

  const userStore = useUserStore()
  const userSettingsStore = useUserSettingsStore()
  const router = useRouter()
  const route = useRoute()

  /** 跳转到密码找回页，并清空当前错误信息 */
  const goToPasswordRecovery = () => {
    errorMessage.value = ''
    void router.push({ name: ROUTE_NAMES.backPassword })
  }

  /** 跳转到注册页，并清空当前错误信息 */
  const goToRegister = () => {
    errorMessage.value = ''
    void router.push({ name: ROUTE_NAMES.register })
  }

  /**
   * 计算登录成功后的目标路径。
   * 若 URL 携带 redirect 查询参数（路由守卫注入），优先回跳；
   * 否则默认进入题目页。
   */
  const getRedirectPath = () => {
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.length > 0) {
      return redirect
    }

    return router.resolve({ name: ROUTE_NAMES.questions }).fullPath
  }

  /**
   * 处理登录提交：
   * 1. 前端基础校验（非空判断）；
   * 2. 调用 /login 接口；
   * 3. 成功时写入用户状态和可用模型列表，然后跳转；
   * 4. 失败时展示错误信息。
   */
  const handleLogin = async () => {
    if (!form.name.trim() || !form.password) {
      errorMessage.value = 'Please fill in all fields'
      return
    }

    isSubmitting.value = true
    errorMessage.value = ''

    try {
      const response = await axios.post<Response<LoginData>>('/login', {
        name: form.name.trim(),
        password: form.password,
      })

      const loginData = response.data.data
      if (!loginData?.token || !loginData.user) {
        throw new Error(response.data.info || 'Login response is invalid')
      }

      // 将后端返回的用户信息写入 Pinia store（自动持久化到 localStorage）
      userStore.setUser({
        name: loginData.user.name,
        user_id: loginData.user.user_id,
        token: loginData.token,
        email: loginData.user.email,
        role: loginData.user.role,
      })

      // 模型列表可能在 loginData.models 或 loginData.user.models，优先取前者
      const loginModels = Array.isArray(loginData.models)
        ? loginData.models
        : Array.isArray(loginData.user.models)
          ? loginData.user.models
          : []
      userSettingsStore.setAvailableModels(loginModels)

      // 跳转（包括可能的回跳）
      await router.push(getRedirectPath())
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Login failed, please try again'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    isSubmitting,
    errorMessage,
    goToPasswordRecovery,
    goToRegister,
    handleLogin,
  }
}
