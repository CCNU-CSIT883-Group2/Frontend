<template>
  <div class="p-2 border rounded-2xl flex flex-col justify-between gap-2 border-color">
    <HistoryFilter
      v-model:create="isCreateRequested"
      v-model:filter="historyFilter"
      :subjects="subjects"
      :tags="tags"
    />

    <div class="w-full h-full flex-1 flex overflow-hidden">
      <HistoryList v-model:selected="selectedHistoryId" :histories="filteredHistories" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HistoryFilter from '@/features/questions/components/history/HistoryFilter.vue'
import HistoryList from '@/features/questions/components/history/HistoryList.vue'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { ProgressStatus, type HistoryFilter as HistoryFilterModel } from '@/types'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, onMounted, ref, watch } from 'vue'

const toast = useToast()

const selectedHistoryId = defineModel<number>('selected', { default: -1 })
const isCreateRequested = ref(false)

const historyStore = useQuestionHistoryStore()
const { histories, hasCreatedHistory, latestCreatedHistoryId, subjects, tags } =
  storeToRefs(historyStore)

watch(isCreateRequested, (requested) => {
  if (!requested) return

  selectedHistoryId.value = -1
  isCreateRequested.value = false
})

watch(hasCreatedHistory, (isCreated) => {
  if (!isCreated) return

  if (latestCreatedHistoryId.value !== null) {
    selectedHistoryId.value = latestCreatedHistoryId.value
  }

  historyStore.clearCreatedHistoryState()
})

onMounted(async () => {
  const error = await historyStore.fetchHistories()
  if (!error) return

  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: error,
    life: 3000,
  })
})

const historyFilter = ref<HistoryFilterModel>({
  subject: undefined,
  tag: undefined,
  content: [],
  status: ProgressStatus.All,
})

const filteredHistories = computed(() => {
  const { subject, tag, status } = historyFilter.value

  return histories.value
    .filter((historyItem) => {
      const matchesSubject = !subject || historyItem.subject === subject
      const matchesTag = !tag || historyItem.tag === tag
      const matchesStatus =
        status === ProgressStatus.All ||
        (status === ProgressStatus.InProgress && historyItem.progress < 1) ||
        (status === ProgressStatus.Finished && historyItem.progress === 1)

      return matchesSubject && matchesTag && matchesStatus
    })
    .sort((a, b) => b.create_time - a.create_time)
})
</script>
