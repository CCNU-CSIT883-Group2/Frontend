import { useUserStore } from '@/stores/user'
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'entry',
    component: () => import('@/views/EntryView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/overview',
    name: 'overview',
    meta: { requiresAuth: true },
    component: () => import('@/views/OverviewView.vue'),
  },
  {
    path: '/questions',
    name: 'questions',
    meta: { requiresAuth: true },
    component: () => import('@/views/QuestionsView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    meta: { requiresAuth: true },
    component: () => import('@/views/UserProfileView.vue'),
  },
  {
    path: '/backpassword',
    name: 'backpassword',
    component: () => import('@/views/BackPasswardView.vue'),
  },
  // Keep compatibility for old typo route.
  {
    path: '/backpassward',
    redirect: { name: 'backpassword' },
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
    name: 'login',
    query: { redirect: to.fullPath },
  }
})

export default router
