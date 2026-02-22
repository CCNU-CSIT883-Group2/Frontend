import { createRouter, createWebHashHistory } from 'vue-router'
import UserProfileView from '@/views/UserProfileView.vue'
import LoginView from '@/views/LoginView.vue'
import BackPasswardView from '@/views/BackPasswardView.vue'

function isLoggedIn() {
  // 假设我们用 localStorage 存储登录信息
  return (localStorage.getItem('token') ?? '') !== ''
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
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
      component: LoginView,
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
    // {
    //   path: '/settings',
    //   name: 'settings',
    //   component: SettingsView,
    // },
    {
      path: '/profile',
      name: 'profile',
      meta: { requiresAuth: true },
      component: UserProfileView,
    },
    {
      path: '/backpassward',
      name: 'backpassward',
      component: BackPasswardView,
    },
  ],
})
router.beforeEach((to, from, next) => {
  // 如果目标页面需要登录才能访问
  if (to.meta.requiresAuth && !isLoggedIn()) {
    // 用户未登录，跳转到登录页面并提示
    alert('请先登录')
    next('/login') // 重定向到登录页面
  } else {
    next() // 允许路由跳转
  }
})
export default router
