/**
 * 文件说明（是什么）：
 * - 本文件是「HTTP 客户端封装」。
 * - 创建并导出统一的请求实例，承载通用请求配置。
 *
 * 设计原因（为什么）：
 * - 集中管理网络层策略，避免在业务代码中重复设置请求细节。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from 'axios'
import { API_BASE_URL } from '@/config'
import { useUserStore } from '@/stores/userStore'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

const PUBLIC_ENDPOINTS = new Set(['/login', '/register'])
const isPublicEndpoint = (url?: string) => {
  if (!url) return false

  try {
    const normalizedUrl = new URL(url, axiosInstance.defaults.baseURL)
    return PUBLIC_ENDPOINTS.has(normalizedUrl.pathname)
  } catch {
    return PUBLIC_ENDPOINTS.has(url)
  }
}

axiosInstance.interceptors.request.use(
  (config) => {
    if (isPublicEndpoint(config.url)) {
      return config
    }

    const userStore = useUserStore()
    const token = userStore.token

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = token
      config.headers.AUTHORIZATION = token
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default axiosInstance
