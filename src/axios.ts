// src/axiosInterceptor.js
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL as string,
})

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    const jwtToken = useUserStore().token
    if (jwtToken) {
      config.headers['Authorization'] = jwtToken
    }
    return config
  },
  (error) => Promise.reject(error),
)

export default axiosInstance
