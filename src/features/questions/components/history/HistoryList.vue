<template>
  <!-- ScrollPanel 提供自定义滚动条样式（通过 CSS 变量控制宽度） -->
  <ScrollPanel class="flex-1 p-0">
    <div class="flex flex-col gap-1">
      <!-- 历史记录列表：单击选中，双击触发删除确认 -->
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
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：HistoryList）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import HistoryListItem from '@/features/questions/components/history/HistoryListItem.vue'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import type { History } from '@/types'
import { useConfirm, useToast } from 'primevue'

interface HistoryListProps {
  /** 经过筛选后的历史记录列表 */
  histories: History[]
}

defineProps<HistoryListProps>()

/** 当前选中的题集 ID（-1 表示未选中） */
const selectedHistoryId = defineModel<number>('selected', { default: -1 })

const toast = useToast()
const confirm = useConfirm()
const historyStore = useQuestionHistoryStore()

/**
 * 显示删除确认弹窗（双击列表项时触发）。
 * 确认后调用 store.deleteHistory：
 * - 成功：将 selectedHistoryId 重置为 -1，弹出 info 通知；
 * - 失败：弹出 error 通知，不改变选中状态。
 */
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
        // 删除成功后取消选中，触发右侧面板切换回创建面板
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
/* 覆盖 PrimeVue ScrollPanel 的滚动条宽度为 8px */
* {
  --p-scrollpanel-bar-size: 8px;
}
</style>
