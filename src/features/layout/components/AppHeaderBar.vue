<template>
  <div
    class="fixed inset-x-0 top-0 z-40 h-14 flex p-4 divide-x divide-solid bg-surface-100 dark:bg-surface-800 divide-surface-300 dark:divide-surface-600 border-b border-surface-200 dark:border-surface-500"
  >
    <div class="flex justify-center flex-none">
      <i
        class="pi pi-prime text-surface-950 dark:text-surface-400 mr-3"
        style="font-size: 1.5rem"
      ></i>
    </div>

    <div class="flex-1 flex justify-between">
      <div class="flex items-center gap-4 ml-3">
        <AppHeaderActionButton
          v-for="action in navigationActions"
          :key="action.to"
          :icon="action.icon"
          :to="action.to"
        />
      </div>

      <div class="flex items-center gap-4 mr-3">
        <AppHeaderActionButton
          :icon="darkMode ? 'sun' : 'moon'"
          @click="userSettingsStore.toggleDarkMode()"
        />
        <AppHeaderActionButton icon="cog" @click="isSettingsVisible = true" />
        <AppHeaderActionButton :to="ROUTE_NAMES.profile" icon="users" />
      </div>

      <Dialog
        v-model:visible="isSettingsVisible"
        header="Settings"
        :modal="true"
        :style="{ width: '48rem', maxWidth: 'calc(100vw - 2rem)' }"
      >
        <p class="mb-4 text-sm text-surface-500 dark:text-surface-300">
          These options apply instantly to your current session.
        </p>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            class="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-800/40"
          >
            <div>
              <div class="text-sm font-medium text-surface-800 dark:text-surface-100">
                Dark mode
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-300">
                Toggle application theme
              </div>
            </div>
            <ToggleSwitch
              :model-value="darkMode"
              @update:model-value="userSettingsStore.setDarkMode"
            />
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
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeaderActionButton from '@/features/layout/components/AppHeaderActionButton.vue'
import { ROUTE_NAMES } from '@/router'
import { useUserSettingsStore } from '@/stores/userStore'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

const navigationActions = [
  { icon: 'pencil', to: ROUTE_NAMES.questions },
  { icon: 'chart-bar', to: ROUTE_NAMES.overview },
] as const

const isSettingsVisible = ref(false)

const userSettingsStore = useUserSettingsStore()
const { settings, darkMode, availableModels, isLoadingModels } = storeToRefs(userSettingsStore)

onMounted(() => {
  void userSettingsStore.loadAvailableModels()
})
</script>
