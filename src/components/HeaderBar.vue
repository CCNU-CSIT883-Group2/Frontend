<template>
  <div
    class="h-14 flex p-4 divide-x divide-solid bg-surface-100 dark:bg-surface-800 divide-surface-300 dark:divide-surface-600 border-b border-surface-200 dark:border-surface-500"
  >
    <div class="flex justify-center flex-none">
      <i
        class="pi pi-prime text-surface-950 dark:text-surface-400 mr-3"
        style="font-size: 1.5rem"
      />
    </div>

    <div class="flex-1 flex justify-between">
      <div class="flex items-center gap-4 ml-3">
        <header-bar-button v-for="a in topAreaActions" :key="a.to" :icon="a.icon" :to="a.to" />
      </div>

      <div class="flex items-center gap-4 mr-3">
        <header-bar-button :icon="isDark ? 'sun' : 'moon'" @click="toggleDark()" />
        <header-bar-button icon="cog" @click="showSettings = true" />
      </div>

      <Dialog class="flex" v-model:visible="showSettings" header="Settings" :modal="true">
        <div class="flex gap-4 flex-col w-80">
          <div class="flex justify-between">
            <span>Dark Mode: </span>
            <toggle-switch v-model="settings.darkMode" />
          </div>
          <div class="flex justify-between">
            <span>Show Difficulty: </span>
            <toggle-switch v-model="settings.questions.showDifficulty" />
          </div>
          <div class="flex justify-between">
            <span>Show Time: </span>
            <toggle-switch v-model="settings.questions.showTime" />
          </div>
          <div class="flex justify-between items-center">
            <span>Show Difficulty: </span>
            <Select
              :options="models"
              :default-value="settings.questions.generate_model"
              v-model="settings.questions.generate_model"
              size="small"
            />
          </div>
        </div>
      </Dialog>
    </div>

    <div class="flex justify-center flex-none" @click="() => router.push({ name: `profile` })">
      <i class="pi pi-bullseye text-surface-950 dark:text-surface-400 ml-3 text-2xl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HeaderBarButton from '@/components/HeaderBarButton.vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { useUserSettingsStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const router = useRouter()

const topAreaActions = ref([
  { icon: 'home', to: 'overview' },
  { icon: 'pencil', to: 'questions' },
])

const isDark = useDark()
const toggleDark = useToggle(isDark)

const showSettings = ref(false)
const models = ref(['ChatGPT', 'Kimi'])

const { settings } = storeToRefs(useUserSettingsStore())
</script>

<style scoped></style>
