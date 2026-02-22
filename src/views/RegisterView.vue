<template>
  <div class="bg-surface-50 dark:bg-surface-950 w-screen h-screen flex items-center justify-center px-4">
    <div
      class="bg-surface-0 dark:bg-surface-900 p-8 shadow-lg rounded-lg w-full max-w-2xl flex flex-col items-center"
    >
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
          <span class="text-surface-600 dark:text-surface-200 font-medium">Already have an account?</span>
          <a class="font-medium ml-2 text-primary cursor-pointer" @click="goToLogin">Login here!</a>
        </div>
      </div>

      <form class="flex flex-col space-y-3 w-full max-w-lg" @submit.prevent="handleRegister">
        <div class="flex flex-col">
          <label for="user-role" class="text-surface-900 dark:text-surface-0 font-medium mb-2">User Role</label>
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

        <div class="flex flex-col">
          <label for="username" class="text-surface-900 dark:text-surface-0 font-medium mb-2">Username</label>
          <FloatLabel variant="in">
            <InputText id="username" v-model="form.name" variant="filled" class="w-full h-12" />
            <label for="username">Username</label>
          </FloatLabel>
        </div>

        <div class="flex flex-col">
          <label for="email" class="text-surface-900 dark:text-surface-0 font-medium mb-2">Email</label>
          <FloatLabel variant="in">
            <InputText id="email" v-model="form.email" variant="filled" class="w-full h-12" />
            <label for="email">Email</label>
          </FloatLabel>
        </div>

        <div class="flex flex-col">
          <label for="password" class="text-surface-900 dark:text-surface-0 font-medium mb-2">Password</label>
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

        <div class="flex flex-col">
          <label for="confirm-password" class="text-surface-900 dark:text-surface-0 font-medium mb-2">
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
          <div v-if="form.confirmPassword" class="mt-1 text-sm">
            <span v-if="!passwordMismatch" class="text-green-600">Passwords match</span>
            <span v-else class="text-red-600">Passwords do not match</span>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <Checkbox id="terms" v-model="termsAccepted" class="mr-2" :binary="true" />
            <label for="terms" class="text-surface-900 dark:text-surface-0">
              I accept the terms and conditions
            </label>
          </div>
          <a class="font-medium text-primary cursor-pointer" @click="termsDialogVisible = true">Read Terms</a>
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
        <Message v-if="successMessage" severity="success" :closable="false">{{ successMessage }}</Message>

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

    <Dialog
      v-model:visible="termsDialogVisible"
      :style="{ width: '50vw' }"
      header="Terms and Conditions"
      :modal="true"
    >
      <p>Please follow the platform terms and conditions.</p>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" @click="termsDialogVisible = false" />
        <Button label="Agree" icon="pi pi-check" @click="agreeTerms" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import axios from '@/axios'
import type { RegisterResponse } from '@/types'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

type UserRole = 'teacher' | 'student'

interface RegisterForm {
  role: UserRole
  name: string
  email: string
  password: string
  confirmPassword: string
}

const roles: Array<{ label: string; value: UserRole }> = [
  { label: 'Teacher', value: 'teacher' },
  { label: 'Student', value: 'student' },
]

const form = reactive<RegisterForm>({
  role: 'student',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const termsAccepted = ref(false)
const termsDialogVisible = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const router = useRouter()

const passwordMismatch = computed(() => form.password !== form.confirmPassword)

const passwordStrength = computed(() => {
  let score = 0
  if (form.password.length >= 8) score += 1
  if (/[0-9]/.test(form.password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) score += 1
  if (/[a-z]/.test(form.password) && /[A-Z]/.test(form.password)) score += 1

  if (score <= 1) return { width: '25%', color: 'bg-red-500', label: 'Weak' }
  if (score === 2) return { width: '50%', color: 'bg-orange-500', label: 'Fair' }
  if (score === 3) return { width: '75%', color: 'bg-blue-500', label: 'Good' }
  return { width: '100%', color: 'bg-green-500', label: 'Strong' }
})

const canSubmit = computed(() => {
  return (
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.password.length > 0 &&
    form.confirmPassword.length > 0 &&
    !passwordMismatch.value &&
    termsAccepted.value
  )
})

const agreeTerms = () => {
  termsAccepted.value = true
  termsDialogVisible.value = false
}

const goToLogin = () => {
  void router.push({ name: 'login' })
}

const handleRegister = async () => {
  if (!canSubmit.value) {
    errorMessage.value = 'Please complete all required fields and accept the terms'
    successMessage.value = ''
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await axios.post<RegisterResponse>('/register', {
      name: form.name.trim(),
      password: form.password,
      email: form.email.trim(),
      role: form.role,
    })

    if (response.data.code !== 200 || !response.data.user) {
      throw new Error(response.data.info || 'Registration failed')
    }

    successMessage.value = response.data.info || 'Registration successful'
    setTimeout(() => {
      void router.push({ name: 'login' })
    }, 600)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Registration failed'
    successMessage.value = ''
  } finally {
    isSubmitting.value = false
  }
}
</script>
