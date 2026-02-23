<template>
  <!-- 全屏居中布局 -->
  <div
    class="bg-surface-50 dark:bg-surface-950 w-screen h-screen flex items-center justify-center px-4"
  >
    <div
      class="bg-surface-0 dark:bg-surface-900 p-8 shadow-lg rounded-lg w-full max-w-2xl flex flex-col items-center"
    >
      <!-- 顶部：Logo + 标题 + 登录引导 -->
      <div class="text-center mb-6 w-full">
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

        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-2">Register</div>
        <div class="flex justify-center">
          <span class="text-surface-600 dark:text-surface-200 font-medium"
            >Already have an account?</span
          >
          <a class="font-medium ml-2 text-primary cursor-pointer" @click="goToLogin">Login here!</a>
        </div>
      </div>

      <!-- 注册表单 -->
      <form class="flex flex-col space-y-3 w-full max-w-lg" @submit.prevent="handleRegister">
        <!-- 用户角色选择 -->
        <div class="flex flex-col">
          <label for="user-role" class="text-surface-900 dark:text-surface-0 font-medium mb-2"
            >User Role</label
          >
          <Select
            id="user-role"
            v-model="form.role"
            :options="roles"
            optionLabel="label"
            optionValue="value"
            placeholder="Select a Role"
            class="w-full"
          />
        </div>

        <!-- 用户名 -->
        <div class="flex flex-col">
          <label for="username" class="text-surface-900 dark:text-surface-0 font-medium mb-2"
            >Username</label
          >
          <FloatLabel variant="in">
            <InputText id="username" v-model="form.name" variant="filled" class="w-full h-12" />
            <label for="username">Username</label>
          </FloatLabel>
        </div>

        <!-- 邮箱 -->
        <div class="flex flex-col">
          <label for="email" class="text-surface-900 dark:text-surface-0 font-medium mb-2"
            >Email</label
          >
          <FloatLabel variant="in">
            <InputText id="email" v-model="form.email" variant="filled" class="w-full h-12" />
            <label for="email">Email</label>
          </FloatLabel>
        </div>

        <!-- 密码 + 强度指示器 -->
        <div class="flex flex-col">
          <label for="password" class="text-surface-900 dark:text-surface-0 font-medium mb-2"
            >Password</label
          >
          <FloatLabel variant="in">
            <InputText
              id="password"
              v-model="form.password"
              type="password"
              variant="filled"
              class="w-full h-12"
            />
            <label for="password">Password</label>
          </FloatLabel>
          <!-- 有输入时展示密码强度进度条（label/color/width 均由 composable 计算） -->
          <div v-if="form.password" class="mt-2">
            <div class="text-sm mb-1">Password Strength: {{ passwordStrength.label }}</div>
            <div class="h-2 rounded-full w-full bg-gray-200">
              <div
                class="h-full rounded-full transition-all"
                :class="passwordStrength.color"
                :style="{ width: passwordStrength.width }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 确认密码 + 匹配状态提示 -->
        <div class="flex flex-col">
          <label
            for="confirm-password"
            class="text-surface-900 dark:text-surface-0 font-medium mb-2"
          >
            Confirm Password
          </label>
          <FloatLabel variant="in">
            <InputText
              id="confirm-password"
              v-model="form.confirmPassword"
              type="password"
              variant="filled"
              class="w-full h-12"
            />
            <label for="confirm-password">Confirm Password</label>
          </FloatLabel>
          <!-- 有输入时展示匹配/不匹配状态 -->
          <div v-if="form.confirmPassword" class="mt-1 text-sm">
            <span v-if="!passwordMismatch" class="text-green-600">Passwords match</span>
            <span v-else class="text-red-600">Passwords do not match</span>
          </div>
        </div>

        <!-- 服务条款同意区 -->
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <Checkbox id="terms" v-model="isTermsAccepted" class="mr-2" :binary="true" />
            <label for="terms" class="text-surface-900 dark:text-surface-0">
              I accept the terms and conditions
            </label>
          </div>
          <!-- 点击查看服务条款弹窗 -->
          <a class="font-medium text-primary cursor-pointer" @click="isTermsDialogVisible = true"
            >Read Terms</a
          >
        </div>

        <!-- 错误/成功消息提示 -->
        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
        <Message v-if="successMessage" severity="success" :closable="false">{{
          successMessage
        }}</Message>

        <!-- 注册按钮：需同意条款 + canSubmit（密码强度足够）才可点击 -->
        <Button
          label="Register"
          icon="pi pi-user-plus"
          class="w-full"
          type="submit"
          :loading="isSubmitting"
          :disabled="isSubmitting || !canSubmit"
        />
      </form>
    </div>

    <!-- 服务条款弹窗（点击"Read Terms"触发） -->
    <Dialog
      v-model:visible="isTermsDialogVisible"
      :style="{ width: '50vw' }"
      header="Terms and Conditions"
      :modal="true"
    >
      <p>Please follow the platform terms and conditions.</p>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="isTermsDialogVisible = false" />
        <!-- 同意按钮：设置 isTermsAccepted = true 并关闭弹窗 -->
        <Button label="Agree" icon="pi pi-check" @click="agreeTerms" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「路由视图组件」。
 * - 负责页面级编排，组合子组件并衔接路由上下文（模块：RegisterView）。
 *
 * 设计原因（为什么）：
 * - 将页面容器职责与可复用业务组件分离，便于扩展页面能力与路由演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useRegisterForm } from '@/features/auth/composables/useRegisterForm'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'

const {
  roles,
  form,
  isTermsAccepted,
  isTermsDialogVisible,
  isSubmitting,
  errorMessage,
  successMessage,
  passwordMismatch,
  passwordStrength,
  canSubmit,
  agreeTerms,
  goToLogin,
  handleRegister,
} = useRegisterForm()
</script>
