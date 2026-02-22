<template>
  <scroll-panel class="flex-1 p-0">
    <confirm-dialog />
    <div class="flex flex-col gap-1">
      <history-list-item
        v-for="historyItem in history"
        :key="historyItem.history_id"
        class="flex-1 h-16 mr-2.5"
        :progress="historyItem.progress"
        :selected="selected === historyItem.history_id"
        :tag="historyItem.tag"
        :title="historyItem.subject"
        :date="new Date(historyItem.create_time * 1000)"
        @click="selected = historyItem.history_id"
        @dblclick="confirmDelete(historyItem.history_id)"
      />
    </div>
  </scroll-panel>
</template>

<script lang="ts" setup>
import HistoryListItem from '@/components/HistoryListItem.vue'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import type { History } from '@/types'
import { useConfirm, useToast } from 'primevue'

defineProps<{
  history: Array<History>
}>()

const selected = defineModel<number>('selected', { default: -1 })

const toast = useToast()
const confirm = useConfirm()
const historyStore = useQuestionHistoryStore()

const confirmDelete = (historyId: number) => {
  confirm.require({
    message: 'Are you sure you want to delete this history?',
    header: 'Delete History',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: async () => {
      const deleted = await historyStore.del(historyId)

      if (deleted) {
        selected.value = -1
        toast.add({ severity: 'info', summary: 'Deleted', detail: 'History deleted', life: 3000 })
        return
      }

      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Could not delete history. Please try again.',
        life: 3000,
      })
    },
  })
}
</script>

<style scoped>
* {
  --p-scrollpanel-bar-size: 8px;
}
</style>
