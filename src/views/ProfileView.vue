<template>
  <div class="bg-surface-50 dark:bg-surface-950 w-screen flex items-center justify-center">
    <div
      class="bg-surface-0 dark:bg-surface-900 shadow-lg rounded-lg w-full max-w-6xl flex flex-col items-center p-6"
    >
      <div class="flex-1 md:mr-10">
        <div class="bg-surface-0 dark:bg-surface-950 p-2 w-[800px] rounded-lg">
          <div class="font-medium text-4xl text-surface-900 dark:text-surface-0 mb-6">
            User Dashboard
          </div>
          <div class="text-surface-500 dark:text-surface-300 mb-10">
            Manage your profile, track progress, and explore more features.
          </div>

          <div class="bg-surface-100 dark:bg-surface-800 p-8 rounded-lg mb-6">
            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                Role
              </div>
              <div class="text-surface-900 dark:text-surface-0 w-full md:w-8/12">
                {{ user.role }}
              </div>
            </li>

            <ProfileEditableRow
              label="Name"
              v-model="form.name"
              :is-editing="isEditingName"
              @toggle="isEditingName = true"
              @save="saveName"
            />

            <ProfileEditableRow
              label="Email"
              v-model="form.email"
              :is-editing="isEditingEmail"
              type="email"
              @toggle="isEditingEmail = true"
              @save="saveEmail"
            />

            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                New Password
              </div>
              <div class="w-full md:w-8/12">
                <InputText
                  v-model="form.newPassword"
                  type="password"
                  class="mb-3 h-10 w-full text-lg"
                  placeholder="New Password"
                />
              </div>
              <div v-if="form.newPassword" class="mt-2 w-full md:w-8/12">
                <div class="text-sm mb-2 flex items-center justify-center">
                  Password Strength: {{ passwordStrength.label }}
                </div>
                <div class="h-2 rounded-full w-full bg-gray-200">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="passwordStrength.color"
                    :style="{ width: passwordStrength.width }"
                  ></div>
                </div>
              </div>
            </li>

            <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
              <div
                class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg"
              >
                Confirm Password
              </div>
              <div class="w-full md:w-8/12">
                <InputText
                  v-model="form.confirmPassword"
                  type="password"
                  class="mb-3 w-full h-10 text-lg"
                  placeholder="Confirm Password"
                />
              </div>
              <div v-if="form.confirmPassword" class="mt-1 w-full md:w-8/12 text-sm">
                <span
                  v-if="!passwordMismatch"
                  class="text-green-600 flex items-center justify-center"
                >
                  Passwords match
                </span>
                <span v-else class="text-red-600 flex items-center justify-center">
                  Passwords do not match
                </span>
              </div>
            </li>
          </div>

          <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
            {{ errorMessage }}
          </Message>
          <Message v-if="successMessage" severity="success" :closable="false" class="mb-4">
            {{ successMessage }}
          </Message>

          <div class="flex justify-center mt-4 space-x-4">
            <Button
              label="Save Changes"
              icon="pi pi-check"
              text
              :loading="isSaving"
              :disabled="isSaving || !canSave"
              @click="saveAllChanges"
            />
            <Button
              label="Log Out"
              icon="pi pi-sign-out"
              text
              class="p-button-danger"
              :loading="isLoggingOut"
              :disabled="isLoggingOut"
              @click="logout"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from '@/axios'
import ProfileEditableRow from '@/features/profile/components/ProfileEditableRow.vue'
import { ROUTE_NAMES } from '@/router'
import { useUserStore } from '@/stores/userStore'
import type { ProfileUpdateRequest, Response } from '@/types'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

interface ProfileForm {
  name: string
  email: string
  newPassword: string
  confirmPassword: string
}

const userStore = useUserStore()
const { user } = storeToRefs(userStore)
const router = useRouter()

const form = reactive<ProfileForm>({
  name: user.value.name,
  email: user.value.email,
  newPassword: '',
  confirmPassword: '',
})

const isEditingName = ref(false)
const isEditingEmail = ref(false)
const isSaving = ref(false)
const isLoggingOut = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

watch(
  () => [user.value.name, user.value.email],
  ([name, email]) => {
    if (!isEditingName.value) form.name = name
    if (!isEditingEmail.value) form.email = email
  },
)

const passwordMismatch = computed(() => form.newPassword !== form.confirmPassword)
const trimmedName = computed(() => form.name.trim())
const trimmedEmail = computed(() => form.email.trim())

const passwordStrength = computed(() => {
  let strength = 0
  if (form.newPassword.length >= 8) strength += 1
  if (/[A-Z]/.test(form.newPassword)) strength += 1
  if (/[0-9]/.test(form.newPassword)) strength += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)) strength += 1

  if (strength <= 1) return { color: 'bg-red-500', width: '25%', label: 'Weak' }
  if (strength === 2) return { color: 'bg-orange-500', width: '50%', label: 'Fair' }
  if (strength === 3) return { color: 'bg-blue-500', width: '75%', label: 'Good' }
  return { color: 'bg-green-500', width: '100%', label: 'Strong' }
})

const hasProfileChanges = computed(() => {
  return trimmedName.value !== user.value.name || trimmedEmail.value !== user.value.email
})

const hasPasswordChanges = computed(() => {
  return form.newPassword.length > 0 && form.confirmPassword.length > 0 && !passwordMismatch.value
})

const canSave = computed(() => hasProfileChanges.value || hasPasswordChanges.value)

const saveName = () => {
  form.name = trimmedName.value
  isEditingName.value = false
}

const saveEmail = () => {
  form.email = trimmedEmail.value
  isEditingEmail.value = false
}

const buildUpdatePayload = (): ProfileUpdateRequest => ({
  name: user.value.name,
  new_name: trimmedName.value !== user.value.name ? trimmedName.value : null,
  new_email: trimmedEmail.value !== user.value.email ? trimmedEmail.value : null,
  new_password: hasPasswordChanges.value ? form.newPassword : null,
})

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const saveAllChanges = async () => {
  if (!canSave.value) return

  const payload = buildUpdatePayload()
  if (!payload.new_name && !payload.new_email && !payload.new_password) return

  isSaving.value = true
  clearMessages()

  try {
    const response = await axios.post<Response<unknown>>('/profile', payload)
    if (response.data.code !== 200) {
      throw new Error(response.data.info || 'Failed to save profile')
    }

    userStore.patchUser({
      name: payload.new_name ?? user.value.name,
      email: payload.new_email ?? user.value.email,
    })

    form.newPassword = ''
    form.confirmPassword = ''
    isEditingName.value = false
    isEditingEmail.value = false
    successMessage.value = response.data.info || 'Profile updated successfully'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save profile'
  } finally {
    isSaving.value = false
  }
}

const logout = async () => {
  isLoggingOut.value = true
  clearMessages()

  try {
    await axios.post('/logout')
  } catch {
    // Keep local logout flow even if server logout fails.
  } finally {
    userStore.clearUser()
    isLoggingOut.value = false
    await router.push({ name: ROUTE_NAMES.login })
  }
}
</script>
