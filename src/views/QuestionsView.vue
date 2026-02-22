<template>
  <div class="m-3 w-full flex-1 min-h-0 flex flex-col gap-2">
    <Toast />

    <div :class="[
      'w-full flex-1 min-h-0 flex relative',
      isSidebarCollapsed ? 'lg:gap-0' : 'lg:gap-2',
    ]">
      <div v-if="!isSidebarCollapsed" class="absolute inset-y-0 right-0 left-16 z-20 backdrop-blur-md lg:hidden"
        aria-hidden="true" @click="toggleSidebar" />

      <div :class="[
        'transition-[width] duration-200 overflow-hidden shrink-0 z-30',
        'absolute left-0 top-0 bottom-0 lg:relative lg:top-auto lg:left-auto lg:bottom-auto',
        isSidebarCollapsed ? 'w-16' : 'w-[min(22rem,85vw)] lg:w-72',
      ]">
        <QuestionSidebar v-model:selected="selectedHistoryId" :collapsed="isSidebarCollapsed" :class="[
          'w-full h-full min-h-0 lg:min-h-0',
          isSidebarCollapsed ? 'lg:min-h-0' : 'lg:min-h-[16rem]',
        ]" @toggle-collapse="toggleSidebar" />
      </div>

      <div class="flex-1 min-h-0 min-w-0 pl-20 lg:pl-0">
        <AnswerPanel v-if="selectedHistoryId !== -1" :key="selectedHistoryId" :history-id="selectedHistoryId"
          class="h-full min-h-0 min-w-0" />
        <QuestionCreatePanel v-else class="h-full min-h-0 min-w-0" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AnswerPanel from '@/features/questions/components/AnswerPanel.vue'
import QuestionCreatePanel from '@/features/questions/components/QuestionCreatePanel.vue'
import QuestionSidebar from '@/features/questions/components/QuestionSidebar.vue'
import { ref } from 'vue'

const selectedHistoryId = ref(-1)
const isSidebarCollapsed = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>
