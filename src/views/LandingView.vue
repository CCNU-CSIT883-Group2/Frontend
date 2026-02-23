<template>
  <div>
    <div
      class="bg-surface-0 dark:bg-surface-950 w-screen h-screen flex items-center justify-center lg:px-20"
    >
      <div class="text-surface-700 dark:text-surface-100 text-center">
        <div class="text-primary font-bold mb-4">
          <i class="pi pi-brain" />&nbsp;POWERED BY CHATGPT
        </div>
        <div class="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-4">
          Welcome to ChatCNU
        </div>
        <div class="text-surface-700 dark:text-surface-100 text-2xl mb-8">
          Revolutionize question generation with the power of ChatGPT.
        </div>
        <Button
          class="font-bold px-8 py-4 whitespace-nowrap"
          icon="pi pi-brain"
          label="Get Started"
          raised
          rounded
          @click="goToLogin"
        />
      </div>
    </div>

    <div class="bg-surface-0 dark:bg-surface-950 px-6 py-20 md:px-12 lg:px-20 text-center">
      <div class="mb-4 font-bold text-3xl">
        <span class="text-surface-900 dark:text-surface-0">Discover, </span>
        <span class="text-primary-600 dark:text-primary-400">Innovate, Excel</span>
      </div>
      <div class="text-surface-700 dark:text-surface-0/70 mb-[3rem]">
        Transform your learning and teaching experiences with AI-driven solutions.
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-3.5 gap-y-6">
        <div v-for="feature in features" :key="feature.title" class="w-full p-4">
          <span
            class="w-16 h-16 mb-6 rounded-lg flex items-center justify-center mx-auto bg-surface-0 dark:bg-surface-800 shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12),0px_0px_2px_0px_rgba(0,0,0,0.06),0px_4px_10px_0px_rgba(0,0,0,0.03)]"
          >
            <i
              :class="`pi ${feature.icon} text-2xl lg:text-3xl text-primary-500 dark:text-primary-400`"
            />
          </span>
          <div class="text-surface-900 dark:text-surface-0 text-xl mb-2 font-medium">
            {{ feature.title }}
          </div>
          <p
            class="text-surface-700 dark:text-surface-0/70 leading-normal max-w-sm mx-auto text-center"
          >
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「路由视图组件」。
 * - 负责页面级编排，组合子组件并衔接路由上下文（模块：LandingView）。
 *
 * 设计原因（为什么）：
 * - 将页面容器职责与可复用业务组件分离，便于扩展页面能力与路由演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { ROUTE_NAMES } from '@/router'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const features = [
  {
    icon: 'pi-user',
    title: 'Personalized Question Generation',
    description: "Tailored questions based on users' learning level, interests, and goals.",
  },
  {
    icon: 'pi-list',
    title: 'Diverse Question Types',
    description:
      'Supports multiple formats, including multiple-choice, fill-in-the-blank, and more.',
  },
  {
    icon: 'pi-refresh',
    title: 'Real-Time Updates',
    description: 'Stay ahead with questions dynamically generated from the latest trends.',
  },
  {
    icon: 'pi-user-edit',
    title: 'Labor Resource Savings',
    description: 'Significantly reduce time and costs in question creation with automation.',
  },
  {
    icon: 'pi-comments',
    title: 'High Interactivity',
    description: 'Users can get real-time hints, explanations, and detailed analyses.',
  },
  {
    icon: 'pi-chart-line',
    title: 'Practice Data Analysis',
    description: 'Analyze user performance to recommend targeted and effective questions.',
  },
] as const

const router = useRouter()

const goToLogin = () => {
  void router.push({ name: ROUTE_NAMES.login })
}
</script>
