import axios from 'axios'
import { useUserStore } from '@/stores/user'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL as string,
})

const PUBLIC_ENDPOINTS = new Set(['/login', '/register'])

axiosInstance.interceptors.request.use(
  (config) => {
    if (config.url && PUBLIC_ENDPOINTS.has(config.url)) {
      return config
    }

    const userStore = useUserStore()
    const token = userStore.token || localStorage.getItem('token')

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.AUTHORIZATION = token
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default axiosInstance
