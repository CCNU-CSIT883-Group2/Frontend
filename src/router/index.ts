import { createRouter, createWebHashHistory } from 'vue-router'
import OverviewView from '@/views/OverviewView.vue'
import SettingsView from '@/views/SettingsView.vue'
import UserProfileView from '@/views/UserProfileView.vue'
import LoginView from '@/views/LoginView.vue'

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
      component: OverviewView,
    },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('@/views/QuestionsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: UserProfileView,
    },
  ],
})

export default router
