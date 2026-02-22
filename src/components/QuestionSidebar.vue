<template>
  <div class="p-2 border rounded-2xl flex flex-col justify-between gap-2 border-color">
    <history-filter
      :subjects="subjects"
      :tags="tags"
      v-model:filter="filter"
      v-model:create="isCreateRequested"
    />

    <div class="w-full h-full flex-1 flex overflow-hidden">
      <history-list v-model:selected="selectedHistoryId" :history="filteredHistory" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HistoryFilter from '@/components/HistoryFilter.vue'
import HistoryList from '@/components/HistoryList.vue'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import { ProgressStatus, type HistoryFilter as HistoryFilterModel } from '@/types'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, onMounted, ref, watch } from 'vue'

const toast = useToast()

const isCreateRequested = ref(false)
const selectedHistoryModel = defineModel<number>('selected', { default: -1 })
const selectedHistoryId = computed({
  get: () => selectedHistoryModel.value,
  set: (value: number) => {
    selectedHistoryModel.value = value
  },
})

const historyStore = useQuestionHistoryStore()
const { histories, added, subjects, tags } = storeToRefs(historyStore)

watch(isCreateRequested, (requested) => {
  if (!requested) return
  selectedHistoryId.value = -1
  isCreateRequested.value = false
})

watch(added, () => {
  if (!added.value || histories.value.length === 0) return

  selectedHistoryId.value = histories.value[histories.value.length - 1].history_id
  added.value = false
})

onMounted(async () => {
  const error = await historyStore.fetch()
  if (!error) return

  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: error,
    life: 3000,
  })
})

const filter = ref<HistoryFilterModel>({
  subject: '',
  tag: '',
  content: [],
  status: ProgressStatus.All,
})

const filteredHistory = computed(() => {
  return [...(histories.value ?? [])]
    .filter((historyItem) => {
      const matchesSubject = !filter.value.subject || historyItem.subject === filter.value.subject
      const matchesTag = !filter.value.tag || historyItem.tag === filter.value.tag
      const matchesStatus =
        filter.value.status === ProgressStatus.All ||
        (filter.value.status === ProgressStatus.InProgress && historyItem.progress < 1) ||
        (filter.value.status === ProgressStatus.Finished && historyItem.progress === 1)

      return matchesSubject && matchesTag && matchesStatus
    })
    .sort((a, b) => b.create_time - a.create_time)
})
</script>

<style scoped></style>
