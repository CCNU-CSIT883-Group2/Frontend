<template>
  <div class="p-2 border rounded-2xl flex flex-col justify-between gap-2 border-color">
    <history-filter
      :subjects="subjects"
      :tags="tags"
      v-model:filter="filter"
      v-model:create="create"
    />
    <div class="w-full h-full flex-1 flex overflow-hidden">
      <history-list v-model:selected="selected" :history="filteredHistory" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import HistoryList from '@/components/HistoryList.vue'
import HistoryFilter from '@/components/HistoryFilter.vue'
import { type HistoryFilter as Filter, ProgressStatus } from '@/types'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'

const toast = useToast()

const create = ref(false)
watch(create, (value) => {
  if (value) {
    selected.value = -1
    create.value = false
  }
})

const selected = ref(-1)
const selectedHistory = defineModel<number>('selected', { default: -1 })
watch(selected, () => {
  selectedHistory.value =
    histories.value.find((h) => h.history_id === selected.value)?.history_id ?? -1
})

const historyStore = useQuestionHistoryStore()
const { histories, added, subjects, tags } = storeToRefs(historyStore)

watch(added, () => {
  if (added.value) {
    selected.value = histories.value[histories.value.length - 1].history_id
    added.value = false
  }
})

onMounted(() => {
  const error = historyStore.fetch()

  const handler = watch(error, () => {
    if (error.value) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.value,
        life: 3000,
      })
    }
    handler.stop()
  })
})

// filter
const filter = ref<Filter>({
  subject: '',
  tag: '',
  content: [],
  status: ProgressStatus.All,
})

// filtered history
const filteredHistory = computed(() => {
  const hists = histories.value ?? []

  return hists
    .filter((h) => {
      return (
        // filter by selected
        h.history_id === selected.value ||
        // filter by subject
        ((filter.value.subject === '' || h.subject === filter.value.subject) &&
          // filter by tag
          (filter.value.tag === '' || h.tag === filter.value.tag) &&
          // filter by status
          (filter.value.status === ProgressStatus.All ||
            (h.progress < 1 && filter.value.status === ProgressStatus.InProgress) ||
            (h.progress === 1 && filter.value.status === ProgressStatus.Finished)))
      )
    })
    .sort((h) => h.create_time)
})
</script>

<style scoped></style>
