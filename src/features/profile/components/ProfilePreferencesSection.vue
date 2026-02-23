<template>
  <section
    class="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
  >
    <header class="mb-4">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Preferences</h2>
      <p class="text-sm text-surface-500 dark:text-surface-300">
        These options apply instantly to your current session.
      </p>
    </header>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div
        class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <div>
          <div class="text-sm font-medium text-surface-800 dark:text-surface-100">Dark mode</div>
          <div class="text-xs text-surface-500 dark:text-surface-300">Toggle application theme</div>
        </div>
        <ToggleSwitch :model-value="darkMode" @update:model-value="userSettingsStore.setDarkMode" />
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <div>
          <div class="text-sm font-medium text-surface-800 dark:text-surface-100">
            Show difficulty
          </div>
          <div class="text-xs text-surface-500 dark:text-surface-300">
            Display question difficulty tags
          </div>
        </div>
        <ToggleSwitch v-model="settings.questions.showDifficulty" />
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <div>
          <div class="text-sm font-medium text-surface-800 dark:text-surface-100">
            Show time hint
          </div>
          <div class="text-xs text-surface-500 dark:text-surface-300">
            Display estimated answer time
          </div>
        </div>
        <ToggleSwitch v-model="settings.questions.showTime" />
      </div>

      <div
        class="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
      >
        <div class="mb-2 text-sm font-medium text-surface-800 dark:text-surface-100">
          Question model
        </div>
        <Select
          v-model="settings.questions.generateModel"
          :options="availableModels"
          option-label="label"
          option-value="value"
          :loading="isLoadingModels"
          placeholder="Select a model"
          class="w-full"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useUserSettingsStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import { onMounted } from 'vue'

const userSettingsStore = useUserSettingsStore()
const { settings, darkMode, availableModels, isLoadingModels } = storeToRefs(userSettingsStore)

onMounted(() => {
  void userSettingsStore.loadAvailableModels()
})
</script>
