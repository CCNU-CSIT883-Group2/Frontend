<template>
  <scroll-panel class="flex-1 p-0">
    <div class="flex flex-col gap-1">
      <question-list-item
        class="flex-1 h-16 mr-2.5"
        v-for="h in props.history"
        :key="h.history_id"
        :progress="h.progress"
        :selected="selected === h.history_id"
        :tag="h.tag"
        :title="h.subject"
        :date="new Date(h.create_time * 1000)"
        @click="handleClicked(h.history_id)"
      />
    </div>
  </scroll-panel>
</template>

<script lang="ts" setup>
import QuestionListItem from '@/components/HistoryListItem.vue'
import type { History } from '@/types'

const props = defineProps<{
  history: Array<History>
}>()

const selected = defineModel<number>('selected', { default: -1 })

const handleClicked = (id: number) => {
  selected.value = id
}
</script>

<style scoped>
* {
  --p-scrollpanel-bar-size: 8px;
}
</style>
