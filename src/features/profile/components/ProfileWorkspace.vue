<template>
  <div class="m-3 flex w-full flex-1 justify-center">
    <Toast position="top-right" />

    <div class="flex w-full max-w-7xl flex-col gap-4 pb-3">
      <section class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <ProfileSummaryCard :name="displayName" :email="displayEmail" :role="displayRole" :user-id="userId"
          :initials="initials" :last-saved-label="lastSavedLabel" :is-activity-loading="isActivityLoading"
          :activity-chart-data="activityChartData" :activity-chart-options="activityChartOptions"
          :unsaved-changes-count="unsavedChangesCount" :is-logging-out="isLoggingOut" @copy-user-id="copyUserId"
          @logout="logout" />

        <div class="flex flex-col gap-4 lg:col-span-2">
          <ProfilePreferencesSection />

          <ProfileAccountSection v-model:name="form.name" v-model:email="form.email" :name-error="nameError"
            :email-error="emailError" :is-saving-name="isSavingName" :is-saving-email="isSavingEmail"
            @save-name="saveName" @save-email="saveEmail" />

          <ProfileSecuritySection v-model:new-password="form.newPassword"
            v-model:confirm-password="form.confirmPassword" :password-rules="passwordRules"
            :password-strength="passwordStrength" :password-error="passwordError" :has-password-input="hasPasswordInput"
            :has-password-changes="hasPasswordChanges" :is-editing-password="isPasswordEditing"
            :is-saving="isSavingPassword" @start-password-edit="startPasswordEditing"
            @cancel-password-edit="cancelPasswordEditing" @save-password="savePassword" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProfileWorkspace } from '@/features/profile/composables/useProfileWorkspace'
import ProfileAccountSection from '@/features/profile/components/ProfileAccountSection.vue'
import ProfilePreferencesSection from '@/features/profile/components/ProfilePreferencesSection.vue'
import ProfileSecuritySection from '@/features/profile/components/ProfileSecuritySection.vue'
import ProfileSummaryCard from '@/features/profile/components/ProfileSummaryCard.vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { watch } from 'vue'

const {
  form,
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
} = useProfileWorkspace()

const toast = useToast()

watch(errorMessage, (message) => {
  if (!message) return

  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: message,
    life: 3200,
  })
  errorMessage.value = ''
})

watch(successMessage, (message) => {
  if (!message) return

  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: message,
    life: 2600,
  })
  successMessage.value = ''
})
</script>
