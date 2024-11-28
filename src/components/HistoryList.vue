<template>
  <scroll-panel class="flex-1 p-0">
    <confirm-dialog />
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
        @click="selected = h.history_id"
        @dblclick="deleteConfirm(h.history_id)"
      />
    </div>
  </scroll-panel>
</template>

<script lang="ts" setup>
import QuestionListItem from '@/components/HistoryListItem.vue'
import type { History } from '@/types'
import { useConfirm, useToast } from 'primevue'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'

const props = defineProps<{
  history: Array<History>
}>()

const selected = defineModel<number>('selected', { default: -1 })

const toast = useToast()
const confirm = useConfirm()
const histories = useQuestionHistoryStore()
const deleteConfirm = (id: number) => {
  confirm.require({
    message: 'Are you want to delete this history?',
    header: 'Danger Zone',
    rejectLabel: 'Cancel',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: () => {
      histories.del(id)
      selected.value = -1
      toast.add({ severity: 'info', summary: 'Deleted', detail: 'History deleted', life: 3000 })
    },
  })
}
</script>

<style scoped>
* {
  --p-scrollpanel-bar-size: 8px;
}
</style>
