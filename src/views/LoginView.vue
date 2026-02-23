<template>
  <!-- 全屏居中布局，深色模式自适应 -->
  <div class="bg-surface-50 dark:bg-surface-950 w-screen h-screen flex items-center justify-center">
    <div class="bg-surface-0 dark:bg-surface-900 p-12 shadow-lg rounded-lg w-full max-w-3xl">
      <!-- 顶部区域：Logo SVG + 标题 + 注册引导链接 -->
      <div class="text-center mb-8">
        <!-- ChatCNU Logo（SVG 内联，深浅模式通过 fill 类切换颜色） -->
        <svg
          class="mb-4 mx-auto fill-surface-600 dark:fill-surface-200 h-16"
          viewBox="0 0 30 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M20.7207 6.18211L14.9944 3.11148L3.46855 9.28678L0.579749 7.73444L14.9944 0L23.6242 4.62977L20.7207 6.18211ZM14.9996 12.3574L26.5182 6.1821L29.4216 7.73443L14.9996 15.4621L6.37724 10.8391L9.27337 9.28677L14.9996 12.3574ZM2.89613 16.572L0 15.0196V24.2656L14.4147 32V28.8953L2.89613 22.7132V16.572ZM11.5185 18.09L0 11.9147V8.81001L14.4147 16.5376V25.7904L11.5185 24.2312V18.09ZM24.2086 15.0194V11.9147L15.5788 16.5377V31.9998L18.475 30.4474V18.09L24.2086 15.0194ZM27.0969 22.7129V10.3623L30.0004 8.81V24.2653L21.3706 28.895V25.7904L27.0969 22.7129Z"
          />
        </svg>

        <div class="text-surface-900 dark:text-surface-0 text-4xl font-medium mb-4">
          Welcome ChatCNU
        </div>
        <span class="text-surface-600 dark:text-surface-200 font-medium leading-normal">
          Don't have an account?
        </span>
        <!-- 跳转注册页的链接 -->
        <a class="font-medium no-underline ml-2 text-primary cursor-pointer" @click="goToRegister">
          Create today!
        </a>
      </div>

      <!-- 登录表单：Enter 提交（@submit.prevent 阻止页面刷新） -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label for="name" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block"
            >Name</label
          >
          <InputText id="name" v-model="form.name" type="text" placeholder="Name" class="w-full" />
        </div>

        <div>
          <label for="password" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">
            Password
          </label>
          <InputText
            id="password"
            v-model="form.password"
            type="password"
            placeholder="Password"
            class="w-full"
          />
        </div>

        <!-- 登录失败时显示错误提示 -->
        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

        <!-- 忘记密码链接（右对齐） -->
        <div class="flex items-center justify-end">
          <a
            class="font-medium no-underline text-primary text-right cursor-pointer"
            @click="goToPasswordRecovery"
          >
            Forgot password?
          </a>
        </div>

        <!-- 登录按钮：提交中时显示加载状态并禁用点击 -->
        <Button
          label="Sign In"
          icon="pi pi-user"
          class="w-full"
          type="submit"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「路由视图组件」。
 * - 负责页面级编排，组合子组件并衔接路由上下文（模块：LoginView）。
 *
 * 设计原因（为什么）：
 * - 将页面容器职责与可复用业务组件分离，便于扩展页面能力与路由演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useLoginForm } from '@/features/auth/composables/useLoginForm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'

// 所有状态和逻辑均由 composable 提供，本组件只负责模板渲染
const {
  form,
  isSubmitting,
  errorMessage,
  goToPasswordRecovery,
  goToRegister,
  handleLogin,
} = useLoginForm()
</script>
