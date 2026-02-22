<template>
  <div class="m-3 w-full flex-1 flex">
    <Toast />
    <QuestionSidebar v-model:selected="selectedHistoryId" class="flex-none w-72" />
    <AnswerPanel
      v-if="selectedHistoryId !== -1"
      :key="selectedHistoryId"
      :history-id="selectedHistoryId"
      class="flex-1 ml-2"
    />
    <QuestionCreatePanel v-else />
  </div>
</template>

<script setup lang="ts">
import AnswerPanel from '@/features/questions/components/AnswerPanel.vue'
import QuestionCreatePanel from '@/features/questions/components/QuestionCreatePanel.vue'
import QuestionSidebar from '@/features/questions/components/QuestionSidebar.vue'
import { ref } from 'vue'

const selectedHistoryId = ref(-1)
</script>
