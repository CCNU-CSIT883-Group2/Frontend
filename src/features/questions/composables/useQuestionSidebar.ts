/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useQuestionSidebar）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { ProgressStatus, type HistoryFilter as HistoryFilterModel } from '@/types'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, onMounted, ref, watch, type Ref } from 'vue'

interface UseQuestionSidebarOptions {
  selectedHistoryId: Ref<number>
}

export const useQuestionSidebar = ({ selectedHistoryId }: UseQuestionSidebarOptions) => {
  const toast = useToast()
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
      .sort((left, right) => right.create_time - left.create_time)
  })

  return {
    isCreateRequested,
    historyFilter,
    filteredHistories,
    subjects,
    tags,
  }
}
