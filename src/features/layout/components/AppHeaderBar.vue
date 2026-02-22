<template>
  <div
    class="h-14 flex p-4 divide-x divide-solid bg-surface-100 dark:bg-surface-800 divide-surface-300 dark:divide-surface-600 border-b border-surface-200 dark:border-surface-500"
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
        <AppHeaderActionButton :icon="isDark ? 'sun' : 'moon'" @click="toggleDark()" />
        <AppHeaderActionButton icon="cog" @click="isSettingsVisible = true" />
        <AppHeaderActionButton :to="ROUTE_NAMES.profile" icon="users" />
      </div>

      <Dialog v-model:visible="isSettingsVisible" class="flex" header="Settings" :modal="true">
        <div class="flex gap-4 flex-col w-80">
          <div class="flex justify-between">
            <span>Dark Mode: </span>
            <ToggleSwitch v-model="settings.darkMode" />
          </div>
          <div class="flex justify-between">
            <span>Show Difficulty: </span>
            <ToggleSwitch v-model="settings.questions.showDifficulty" />
          </div>
          <div class="flex justify-between">
            <span>Show Time: </span>
            <ToggleSwitch v-model="settings.questions.showTime" />
          </div>
          <div class="flex justify-between items-center">
            <span>Generate Model: </span>
            <Select
              v-model="settings.questions.generateModel"
              :options="availableModels"
              class="w-36"
              size="small"
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
import { useDark, useToggle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const navigationActions = [
  { icon: 'pencil', to: ROUTE_NAMES.questions },
  { icon: 'chart-bar', to: ROUTE_NAMES.overview },
] as const

const availableModels: string[] = ['ChatGPT', 'Kimi']

const isDark = useDark()
const toggleDark = useToggle(isDark)

const isSettingsVisible = ref(false)

const { settings } = storeToRefs(useUserSettingsStore())
</script>
