import { useProfileActivityChart } from '@/features/profile/composables/profileActivityChart'
import {
  submitLogout,
  submitProfileUpdate,
} from '@/features/profile/composables/profileWorkspace.api'
import { useProfilePasswordState } from '@/features/profile/composables/profilePasswordState'
import {
  formatLastSavedAt,
  getProfileInitials,
  validateProfileEmail,
  validateProfileName,
} from '@/features/profile/composables/profileWorkspace.helpers'
import { ROUTE_NAMES } from '@/router'
import { useUserStore } from '@/stores/userStore'
import type { ProfileUpdateRequest } from '@/types'
import { useClipboard } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

interface ProfileFormState {
  name: string
  email: string
  newPassword: string
  confirmPassword: string
}

export type {
  PasswordRuleState,
  PasswordStrengthState,
} from '@/features/profile/composables/profilePasswordState'

export const useProfileWorkspace = () => {
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)
  const router = useRouter()

  const form = reactive<ProfileFormState>({
    name: user.value.name,
    email: user.value.email,
    newPassword: '',
    confirmPassword: '',
  })

  const isSavingName = ref(false)
  const isSavingEmail = ref(false)
  const isSavingPassword = ref(false)
  const isSaving = computed(
    () => isSavingName.value || isSavingEmail.value || isSavingPassword.value,
  )
  const isLoggingOut = ref(false)
  const isPasswordEditing = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const lastSavedAt = ref<Date | null>(null)
  const { copy: copyToClipboard, isSupported: isClipboardSupported } = useClipboard()

  const trimmedName = computed(() => form.name.trim())
  const trimmedEmail = computed(() => form.email.trim())

  const displayName = computed(() => trimmedName.value || 'Guest User')
  const displayEmail = computed(() => trimmedEmail.value || 'No email provided')
  const displayRole = computed(() => user.value.role || 'Member')
  const userId = computed(() => user.value.user_id)
  const initials = computed(() => getProfileInitials(trimmedName.value, trimmedEmail.value))

  const nameError = computed(() => validateProfileName(trimmedName.value))
  const emailError = computed(() => validateProfileEmail(trimmedEmail.value))

  const hasProfileChanges = computed(
    () => trimmedName.value !== user.value.name || trimmedEmail.value !== user.value.email,
  )

  const {
    passwordRules,
    passwordStrength,
    passwordError,
    hasPasswordInput,
    hasPasswordChanges,
    clearPasswordFields,
  } = useProfilePasswordState(form)

  const unsavedChangesCount = computed(
    () => Number(hasProfileChanges.value) + Number(hasPasswordInput.value),
  )

  const lastSavedLabel = computed(() => formatLastSavedAt(lastSavedAt.value))

  const { isActivityLoading, activityChartData, activityChartOptions } = useProfileActivityChart(
    computed(() => user.value.name),
  )

  watch(
    () => [user.value.name, user.value.email] as const,
    ([nextName, nextEmail], [previousName, previousEmail]) => {
      const hasDraftAgainstPrevious =
        form.name.trim() !== previousName || form.email.trim() !== previousEmail

      if (!hasDraftAgainstPrevious) {
        form.name = nextName
        form.email = nextEmail
      }
    },
  )

  const clearMessages = () => {
    errorMessage.value = ''
    successMessage.value = ''
  }

  const saveName = async () => {
    clearMessages()

    if (isSavingName.value) return

    if (nameError.value) {
      errorMessage.value = nameError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: trimmedName.value !== user.value.name ? trimmedName.value : null,
      new_email: null,
      new_password: null,
    }

    if (!payload.new_name) return

    isSavingName.value = true

    try {
      const info = await submitProfileUpdate(payload, 'Failed to update display name.')

      userStore.patchUser({
        name: payload.new_name ?? user.value.name,
      })

      form.name = payload.new_name ?? user.value.name
      lastSavedAt.value = new Date()
      successMessage.value = info || 'Display name updated.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to update display name.'
    } finally {
      isSavingName.value = false
    }
  }

  const saveEmail = async () => {
    clearMessages()

    if (isSavingEmail.value) return

    if (emailError.value) {
      errorMessage.value = emailError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: null,
      new_email: trimmedEmail.value !== user.value.email ? trimmedEmail.value : null,
      new_password: null,
    }

    if (!payload.new_email) return

    isSavingEmail.value = true

    try {
      const info = await submitProfileUpdate(payload, 'Failed to update email address.')

      userStore.patchUser({
        email: payload.new_email ?? user.value.email,
      })

      form.email = payload.new_email ?? user.value.email
      lastSavedAt.value = new Date()
      successMessage.value = info || 'Email address updated.'
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Failed to update email address.'
    } finally {
      isSavingEmail.value = false
    }
  }

  const startPasswordEditing = () => {
    if (isSavingPassword.value) return

    clearMessages()
    isPasswordEditing.value = true
  }

  const cancelPasswordEditing = () => {
    clearPasswordFields()
    isPasswordEditing.value = false
    clearMessages()
  }

  const savePassword = async () => {
    clearMessages()

    if (isSavingPassword.value || !isPasswordEditing.value) return

    if (!hasPasswordInput.value) {
      errorMessage.value = 'Please enter and confirm your new password.'
      return
    }

    if (passwordError.value) {
      errorMessage.value = passwordError.value
      return
    }

    const payload: ProfileUpdateRequest = {
      new_name: null,
      new_email: null,
      new_password: form.newPassword,
    }

    isSavingPassword.value = true

    try {
      const info = await submitProfileUpdate(payload, 'Failed to update password.')

      clearPasswordFields()
      isPasswordEditing.value = false
      lastSavedAt.value = new Date()
      successMessage.value = info || 'Password updated successfully.'
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Failed to update password.'
    } finally {
      isSavingPassword.value = false
    }
  }

  const copyUserId = async () => {
    clearMessages()

    const currentUserId = user.value.user_id?.trim()
    if (!currentUserId) {
      errorMessage.value = 'User ID is unavailable.'
      return
    }

    if (!isClipboardSupported.value) {
      errorMessage.value = 'Clipboard is not available in this browser.'
      return
    }

    try {
      await copyToClipboard(currentUserId)
      successMessage.value = 'User ID copied to clipboard.'
    } catch {
      errorMessage.value = 'Unable to copy User ID.'
    }
  }

  const logout = async () => {
    isLoggingOut.value = true
    clearMessages()

    try {
      await submitLogout()
    } catch {
      // Keep local logout flow even if server logout fails.
    } finally {
      userStore.clearUser()
      isLoggingOut.value = false
      await router.push({ name: ROUTE_NAMES.login })
    }
  }

  return {
    form,
    isSaving,
    isSavingName,
    isSavingEmail,
    isSavingPassword,
    isLoggingOut,
    isPasswordEditing,
    isActivityLoading,
    errorMessage,
    successMessage,
    displayName,
    displayEmail,
    displayRole,
    userId,
    initials,
    nameError,
    emailError,
    hasProfileChanges,
    hasPasswordInput,
    hasPasswordChanges,
    passwordRules,
    passwordStrength,
    passwordError,
    unsavedChangesCount,
    lastSavedLabel,
    activityChartData,
    activityChartOptions,
    saveName,
    saveEmail,
    startPasswordEditing,
    cancelPasswordEditing,
    savePassword,
    copyUserId,
    logout,
  }
}
