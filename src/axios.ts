// src/axiosInterceptor.js
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_BASE_URL as string,
})

// 添加请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.url === '/login' || config.url === '/register') {
      return config
    }
    const token = localStorage.getItem('token') || useUserStore().token

    if (token) {
      config.headers['Authorization'] = token
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default axiosInstance
