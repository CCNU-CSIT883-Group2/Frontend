<template>
  <div class="bg-surface-50 dark:bg-surface-950 w-screen h-screen flex items-center justify-center">
    <div class="bg-surface-0 dark:bg-surface-900 p-12 shadow-lg rounded-lg w-full max-w-3xl">
      <div class="text-center mb-8">
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

        <div class="text-surface-900 dark:text-surface-0 text-4xl font-medium mb-4">Welcome ChatCNU</div>
        <span class="text-surface-600 dark:text-surface-200 font-medium leading-normal">
          Don't have an account?
        </span>
        <a class="font-medium no-underline ml-2 text-primary cursor-pointer" @click="goToRegister">
          Create today!
        </a>
      </div>

      <form class="space-y-4" @submit.prevent="handleLogin">
        <div>
          <label for="name" class="text-surface-900 dark:text-surface-0 font-medium mb-2 block">Name</label>
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

        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

        <div class="flex items-center justify-end">
          <a class="font-medium no-underline text-primary text-right cursor-pointer" @click="goToBackPassword">
            Forgot password?
          </a>
        </div>

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
import axios from '@/axios'
import { useUserStore } from '@/stores/user'
import type { LoginData, Response } from '@/types'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface LoginForm {
  name: string
  password: string
}

const form = reactive<LoginForm>({
  name: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const goToBackPassword = () => {
  errorMessage.value = ''
  void router.push({ name: 'backpassword' })
}

const goToRegister = () => {
  errorMessage.value = ''
  void router.push({ name: 'register' })
}

const getRedirectPath = () => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.length > 0 ? redirect : '/questions'
}

const handleLogin = async () => {
  if (!form.name.trim() || !form.password) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const response = await axios.post<Response<LoginData>>('/login', {
      name: form.name.trim(),
      password: form.password,
    })

    const loginData = response.data.data
    if (!loginData?.token || !loginData.user) {
      throw new Error(response.data.info || 'Login response is invalid')
    }

    userStore.setUser({
      name: loginData.user.name,
      user_id: loginData.user.user_id,
      token: loginData.token,
      email: loginData.user.email,
      role: loginData.user.role,
    })

    await router.push(getRedirectPath())
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed, please try again'
  } finally {
    isSubmitting.value = false
  }
}
</script>
