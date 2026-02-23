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

interface LoginForm {
  name: string
  password: string
}

export const useLoginForm = () => {
  const form = reactive<LoginForm>({
    name: '',
    password: '',
  })

  const isSubmitting = ref(false)
  const errorMessage = ref('')

  const userStore = useUserStore()
  const userSettingsStore = useUserSettingsStore()
  const router = useRouter()
  const route = useRoute()

  const goToPasswordRecovery = () => {
    errorMessage.value = ''
    void router.push({ name: ROUTE_NAMES.backPassword })
  }

  const goToRegister = () => {
    errorMessage.value = ''
    void router.push({ name: ROUTE_NAMES.register })
  }

  const getRedirectPath = () => {
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.length > 0) {
      return redirect
    }

    return router.resolve({ name: ROUTE_NAMES.questions }).fullPath
  }

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

      userStore.setUser({
        name: loginData.user.name,
        user_id: loginData.user.user_id,
        token: loginData.token,
        email: loginData.user.email,
        role: loginData.user.role,
      })

      const loginModels = Array.isArray(loginData.models)
        ? loginData.models
        : Array.isArray(loginData.user.models)
          ? loginData.user.models
          : []
      userSettingsStore.setAvailableModels(loginModels)

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
