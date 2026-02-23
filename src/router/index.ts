/**
 * 文件说明（是什么）：
 * - 本文件是「路由配置模块」。
 * - 定义页面路由、导航规则和按需加载边界。
 *
 * 设计原因（为什么）：
 * - 统一管理导航映射，避免路由配置分散导致维护成本升高。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useUserStore } from '@/stores/userStore'
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const ROUTE_NAMES = {
  entry: 'entry',
  register: 'register',
  login: 'login',
  overview: 'overview',
  questions: 'questions',
  profile: 'profile',
  backPassword: 'backpassword',
} as const

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: ROUTE_NAMES.entry,
    component: () => import('@/views/LandingView.vue'),
  },
  {
    path: '/register',
    name: ROUTE_NAMES.register,
    component: () => import('@/views/RegisterView.vue'),
  },
  {
    path: '/login',
    name: ROUTE_NAMES.login,
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/overview',
    name: ROUTE_NAMES.overview,
    meta: { requiresAuth: true },
    component: () => import('@/views/OverviewView.vue'),
  },
  {
    path: '/questions',
    name: ROUTE_NAMES.questions,
    meta: { requiresAuth: true },
    component: () => import('@/views/QuestionsView.vue'),
  },
  {
    path: '/profile',
    name: ROUTE_NAMES.profile,
    meta: { requiresAuth: true },
    component: () => import('@/views/ProfileView.vue'),
  },
  {
    path: '/backpassword',
    name: ROUTE_NAMES.backPassword,
    component: () => import('@/views/BackPasswordView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  // 仅对显式声明 requiresAuth 的路由做登录检查。
  if (!to.meta.requiresAuth) {
    return true
  }

  const userStore = useUserStore()
  if (userStore.isAuthenticated) {
    return true
  }

  return {
    // 保留原目标路径，登录成功后可回跳。
    name: ROUTE_NAMES.login,
    query: { redirect: to.fullPath },
  }
})

export default router
