<template>
  <div class="p-2 border rounded-2xl flex flex-col justify-between gap-2 border-color">
    <history-filter :subjects="subjects" :tags="tags" v-model:filter="filter" />
    <div class="w-full h-full flex-1 flex overflow-hidden">
      <history-list v-model:selected="selected" :history="filteredHistory" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import HistoryList from '@/components/HistoryList.vue'
import HistoryFilter from '@/components/HistoryFilter.vue'
import { type History, type HistoryFilter as Filter, ProgressStatus } from '@/types'

const selected = ref(-1)
const history = ref<Array<History>>([
  { subject: 'Australia', tag: 'AU', progress: 1, create_time: new Date(), history_id: 1 },
  { subject: 'Brazil', tag: 'BR', progress: 1, create_time: new Date(), history_id: 2 },
  { subject: 'China', tag: 'CN', progress: 1, create_time: new Date(), history_id: 3 },
  { subject: 'Egypt', tag: 'EG', progress: 1, create_time: new Date(), history_id: 4 },
  { subject: 'France', tag: 'FR', progress: 1, create_time: new Date(), history_id: 5 },
  { subject: 'Germany', tag: 'DE', progress: 1, create_time: new Date(), history_id: 6 },
  { subject: 'India', tag: 'IN', progress: 1, create_time: new Date(), history_id: 7 },
  { subject: 'Japan', tag: 'JP', progress: 1, create_time: new Date(), history_id: 8 },
  { subject: 'Spain', tag: 'ES', progress: 1, create_time: new Date(), history_id: 9 },
  { subject: 'United States', tag: 'US', progress: 1, create_time: new Date(), history_id: 10 },
  { subject: 'Australia', tag: 'AU', progress: 1, create_time: new Date(), history_id: 11 },
  { subject: 'Brazil', tag: 'BR', progress: 1, create_time: new Date(), history_id: 12 },
  { subject: 'China', tag: 'CN', progress: 1, create_time: new Date(), history_id: 13 },
  { subject: 'Egypt', tag: 'EG', progress: 1, create_time: new Date(), history_id: 14 },
  { subject: 'France', tag: 'FR', progress: 1, create_time: new Date(), history_id: 15 },
  { subject: 'Germany', tag: 'DE', progress: 1, create_time: new Date(), history_id: 16 },
  { subject: 'India', tag: 'IN', progress: 1, create_time: new Date(), history_id: 17 },
  { subject: 'Japan', tag: 'JP', progress: 1, create_time: new Date(), history_id: 18 },
])
// deduplicate subjects
const subjects = computed(() => Array.from(new Set(history.value.map((h) => h.subject))))

// deduplicate tags
const tags = computed(() => Array.from(new Set(history.value.map((h) => h.tag))))

// filter
const filter = ref<Filter>({
  subject: '',
  tag: '',
  content: [],
  status: ProgressStatus.All,
})

// filtered history
const filteredHistory = computed(() => {
  return history.value
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
    .sort((h) => h.create_time.getTime())
})
</script>

<style scoped></style>
