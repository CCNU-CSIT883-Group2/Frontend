<template>
  <div class="p-2 border rounded-2xl flex flex-col justify-between gap-2 border-color">
    <history-filter :subjects="subjects" :tags="tags" v-model:filter="filter" />
    <div class="w-full h-full flex-1 flex overflow-hidden">
      <history-list v-model:selected="selected" :history="filteredHistory" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import HistoryList from '@/components/HistoryList.vue'
import HistoryFilter from '@/components/HistoryFilter.vue'
import { type History, type HistoryFilter as Filter, ProgressStatus } from '@/types'
import { useQuestionHistory } from '@/hooks/useQuestionHistory'

const selected = ref(-1)
const selectedHistory = defineModel<number>('selected', { default: -1 })
watch(selected, () => {
  selectedHistory.value =
    histories.value.find((h) => h.history_id === selected.value)?.history_id ?? -1
})
const histories = ref<History[]>([])

// deduplicate subjects
const subjects = ref<string[]>([])
// deduplicate tags
const tags = ref<string[]>([])

const { history, isFetching, cancel } = useQuestionHistory()
watch(isFetching, (fetching) => {
  if (!fetching) {
    histories.value = history.value as History[]
    subjects.value = Array.from(new Set(histories.value.map((h) => h.subject)))
    tags.value = Array.from(new Set(histories.value.map((h) => h.tag)))
  }
})
onUnmounted(() => {
  cancel()
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
  return histories.value
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
