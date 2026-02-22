<template>
  <ScrollPanel class="flex-1 p-0">
    <ConfirmDialog />
    <div class="flex flex-col gap-1">
      <HistoryListItem
        v-for="historyItem in histories"
        :key="historyItem.history_id"
        :date="new Date(historyItem.create_time * 1000)"
        :is-selected="selectedHistoryId === historyItem.history_id"
        :progress="historyItem.progress"
        :tag="historyItem.tag"
        :title="historyItem.subject"
        class="flex-1 h-16 mr-2.5"
        @click="selectedHistoryId = historyItem.history_id"
        @dblclick="confirmDelete(historyItem.history_id)"
      />
    </div>
  </ScrollPanel>
</template>

<script lang="ts" setup>
import HistoryListItem from '@/features/questions/components/history/HistoryListItem.vue'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import type { History } from '@/types'
import { useConfirm, useToast } from 'primevue'

interface HistoryListProps {
  histories: History[]
}

defineProps<HistoryListProps>()

const selectedHistoryId = defineModel<number>('selected', { default: -1 })

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
      const deleted = await historyStore.deleteHistory(historyId)

      if (deleted) {
        selectedHistoryId.value = -1
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
