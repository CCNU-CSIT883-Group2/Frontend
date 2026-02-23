<template>
  <section
    class="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
  >
    <header class="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Security</h2>
        <p class="text-sm text-surface-500 dark:text-surface-300">
          Change your password with real-time strength and rule checks.
        </p>
      </div>

      <Button
        v-if="!isEditingPassword"
        label="Modify Password"
        icon="pi pi-key"
        size="small"
        text
        :disabled="isSaving"
        @click="emit('startPasswordEdit')"
      />
      <div v-else class="flex items-center gap-2">
        <Button
          label="Cancel"
          icon="pi pi-times"
          size="small"
          text
          severity="secondary"
          :disabled="isSaving"
          @click="emit('cancelPasswordEdit')"
        />
        <Button
          label="Save"
          icon="pi pi-check"
          size="small"
          :loading="isSaving"
          :disabled="isSaving"
          @click="emit('savePassword')"
        />
      </div>
    </header>

    <div v-if="isEditingPassword">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="space-y-2">
          <label
            for="profile-new-password"
            class="text-sm font-medium text-surface-700 dark:text-surface-200"
          >
            New password
          </label>
          <div class="relative">
            <InputText
              id="profile-new-password"
              v-model="newPasswordModel"
              class="w-full pr-10"
              :type="showNewPassword ? 'text' : 'password'"
              placeholder="Create a new password"
              autocomplete="new-password"
            />
            <Button
              :icon="showNewPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              text
              severity="secondary"
              class="!absolute right-0 top-1/2 -translate-y-1/2"
              aria-label="Toggle new password visibility"
              @click="showNewPassword = !showNewPassword"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label
            for="profile-confirm-password"
            class="text-sm font-medium text-surface-700 dark:text-surface-200"
          >
            Confirm password
          </label>
          <div class="relative">
            <InputText
              id="profile-confirm-password"
              v-model="confirmPasswordModel"
              class="w-full pr-10"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Confirm the new password"
              autocomplete="new-password"
            />
            <Button
              :icon="showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"
              text
              severity="secondary"
              class="!absolute right-0 top-1/2 -translate-y-1/2"
              aria-label="Toggle confirm password visibility"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </div>
        </div>
      </div>

      <section
        class="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="text-surface-700 dark:text-surface-200">Password strength</span>
          <span class="font-medium text-surface-900 dark:text-surface-0">{{
            passwordStrength.label
          }}</span>
        </div>

        <div class="h-2 rounded-full bg-surface-200 dark:bg-surface-700">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="passwordStrength.barClass"
            :style="{ width: `${passwordStrength.value}%` }"
          />
        </div>

        <p class="mt-2 text-xs text-surface-500 dark:text-surface-300">
          {{ passwordStrength.description }}
        </p>

        <ul class="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <li
            v-for="rule in passwordRules"
            :key="rule.key"
            class="flex items-center gap-2"
            :class="
              rule.passed
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-surface-500 dark:text-surface-300'
            "
          >
            <i class="pi text-xs" :class="rule.passed ? 'pi-check-circle' : 'pi-circle'" />
            <span>{{ rule.label }}</span>
          </li>
        </ul>
      </section>

      <p v-if="passwordError" class="mt-3 text-sm text-red-500">{{ passwordError }}</p>
      <p v-else-if="hasPasswordChanges" class="mt-3 text-sm text-emerald-500">
        Password update is ready to save.
      </p>
      <p v-else-if="hasPasswordInput" class="mt-3 text-sm text-surface-500 dark:text-surface-300">
        Complete both fields to enable password update.
      </p>
    </div>
    <p v-else class="text-sm text-surface-500 dark:text-surface-300">
      Password fields are shown only when you click
      <span class="font-medium">Modify Password</span>.
    </p>
  </section>
</template>

<script setup lang="ts">
import type {
  PasswordRuleState,
  PasswordStrengthState,
} from '@/features/profile/composables/useProfileWorkspace'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import { ref, watch } from 'vue'

interface ProfileSecuritySectionProps {
  passwordRules: PasswordRuleState[]
  passwordStrength: PasswordStrengthState
  passwordError: string
  hasPasswordInput: boolean
  hasPasswordChanges: boolean
  isEditingPassword: boolean
  isSaving: boolean
}

const props = defineProps<ProfileSecuritySectionProps>()

const emit = defineEmits<{
  startPasswordEdit: []
  cancelPasswordEdit: []
  savePassword: []
}>()

const newPasswordModel = defineModel<string>('newPassword', { default: '' })
const confirmPasswordModel = defineModel<string>('confirmPassword', { default: '' })

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

watch(
  () => props.isEditingPassword,
  (isEditing) => {
    if (!isEditing) {
      showNewPassword.value = false
      showConfirmPassword.value = false
    }
  },
)
</script>
