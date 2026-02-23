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

        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
          Password Recovery
        </div>
        <span class="text-surface-600 dark:text-surface-200 font-medium leading-normal">
          Recover your account with verification code
        </span>
      </div>

      <div class="space-y-4 w-full">
        <template v-if="isRecovering">
          <FloatLabel variant="in">
            <InputText id="email" v-model="email" variant="filled" class="w-full" />
            <label for="email">Email</label>
          </FloatLabel>

          <FloatLabel variant="in">
            <InputText
              id="verification-code"
              v-model="verificationCode"
              variant="filled"
              class="w-full"
            />
            <label for="verification-code">Verification Code</label>
          </FloatLabel>

          <div class="flex items-center gap-3">
            <Button
              label="Send Verification Code"
              @click="sendVerificationCode"
              :disabled="isSending || !email.trim()"
            />
            <span v-if="countdown > 0" class="text-sm text-surface-600 dark:text-surface-300">
              {{ countdown }}s before resend
            </span>
          </div>

          <Button label="Verify Code" class="w-full" @click="verifyCode" />
        </template>

        <template v-else>
          <FloatLabel variant="in">
            <InputText
              id="new-password"
              v-model="newPassword"
              :type="isNewPasswordVisible ? 'text' : 'password'"
              variant="filled"
              class="w-full"
            />
            <label for="new-password">New Password</label>
          </FloatLabel>

          <div class="flex items-center gap-2 text-sm">
            <Button
              icon="pi pi-eye"
              severity="secondary"
              outlined
              @click="isNewPasswordVisible = !isNewPasswordVisible"
            />
            <span>Password strength: {{ passwordStrength }}</span>
          </div>

          <FloatLabel variant="in">
            <InputText
              id="confirm-password"
              v-model="confirmPassword"
              :type="isConfirmPasswordVisible ? 'text' : 'password'"
              variant="filled"
              class="w-full"
            />
            <label for="confirm-password">Confirm Password</label>
          </FloatLabel>

          <div class="flex items-center gap-2 text-sm">
            <Button
              icon="pi pi-eye"
              severity="secondary"
              outlined
              @click="isConfirmPasswordVisible = !isConfirmPasswordVisible"
            />
            <span>Toggle confirm password visibility</span>
          </div>

          <Message v-if="passwordMismatch" severity="error" :closable="false">
            Passwords do not match.
          </Message>

          <Button label="Confirm Reset" class="w-full" @click="confirmModification" />
        </template>

        <Message v-if="statusMessage" :severity="statusMessageSeverity" :closable="false">{{
          statusMessage
        }}</Message>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ROUTE_NAMES } from '@/router'
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { useIntervalFn, useTimeoutFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const verificationCode = ref('')
const countdown = ref(0)
const isSending = ref(false)
const isRecovering = ref(true)
const newPassword = ref('')
const confirmPassword = ref('')
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const statusMessage = ref('')
const statusMessageSeverity = ref<'success' | 'error' | 'info'>('info')

const router = useRouter()

const passwordMismatch = computed(
  () =>
    !!newPassword.value && !!confirmPassword.value && newPassword.value !== confirmPassword.value,
)

const passwordStrength = computed(() => {
  if (newPassword.value.length < 6) return 'Weak'
  if (newPassword.value.length < 10) return 'Medium'
  return 'Strong'
})

const clearMessage = () => {
  statusMessage.value = ''
}

const { pause: pauseCountdown, resume: resumeCountdown } = useIntervalFn(
  () => {
    if (countdown.value <= 1) {
      countdown.value = 0
      isSending.value = false
      pauseCountdown()
      return
    }

    countdown.value -= 1
  },
  1000,
  { immediate: false },
)

const { start: startRedirect, stop: stopRedirect } = useTimeoutFn(
  () => {
    void router.push({ name: ROUTE_NAMES.login })
  },
  500,
  { immediate: false },
)

const startCountdown = () => {
  countdown.value = 60
  isSending.value = true
  pauseCountdown()
  resumeCountdown()
}

const sendVerificationCode = () => {
  if (!email.value.trim() || isSending.value) return

  clearMessage()
  startCountdown()

  // Mock behavior only: backend integration is intentionally out of scope.
  statusMessageSeverity.value = 'success'
  statusMessage.value = `Verification code sent to ${email.value.trim()}`
}

const verifyCode = () => {
  clearMessage()

  if (verificationCode.value.trim() !== '123456') {
    statusMessageSeverity.value = 'error'
    statusMessage.value = 'Invalid verification code.'
    return
  }

  statusMessageSeverity.value = 'success'
  statusMessage.value = 'Verification succeeded. Please set a new password.'
  isRecovering.value = false
}

const confirmModification = () => {
  clearMessage()

  if (passwordMismatch.value) {
    statusMessageSeverity.value = 'error'
    statusMessage.value = 'Passwords do not match.'
    return
  }

  if (!newPassword.value) {
    statusMessageSeverity.value = 'error'
    statusMessage.value = 'Please enter a new password.'
    return
  }

  // Mock behavior only: backend integration is intentionally out of scope.
  statusMessageSeverity.value = 'success'
  statusMessage.value = 'Password reset completed. Redirecting to login...'

  stopRedirect()
  startRedirect()
}
</script>
