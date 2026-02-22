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
    const token = userStore.token || localStorage.getItem('token')

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
