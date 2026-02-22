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
  if (!to.meta.requiresAuth) {
    return true
  }

  const userStore = useUserStore()
  if (userStore.isAuthenticated) {
    return true
  }

  return {
    name: ROUTE_NAMES.login,
    query: { redirect: to.fullPath },
  }
})

export default router
