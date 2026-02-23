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
  /** 当前选中的题集 ID（-1 表示未选中，显示创建面板） */
  selectedHistoryId: Ref<number>
}

/**
 * 题目侧边栏核心 composable。
 *
 * 职责：
 * 1. 组件挂载时加载题集历史列表；
 * 2. 监听"创建请求"信号，切换 selectedHistoryId 到 -1（触发创建面板）；
 * 3. 监听"创建完成"信号，自动切换 selectedHistoryId 到新建的题集；
 * 4. 提供基于 subject、tag、status 的本地过滤逻辑。
 */
export const useQuestionSidebar = ({ selectedHistoryId }: UseQuestionSidebarOptions) => {
  const toast = useToast()

  /** 是否已触发创建请求（HistoryFilter 中的"+"按钮被点击时设为 true） */
  const isCreateRequested = ref(false)

  const historyStore = useQuestionHistoryStore()
  const { histories, hasCreatedHistory, latestCreatedHistoryId, subjects, tags } =
    storeToRefs(historyStore)

  /**
   * 监听创建请求标志：
   * 一旦被设为 true，将 selectedHistoryId 切换到 -1（展示创建面板），
   * 然后立即清除标志，保证下次点击仍然生效。
   */
  watch(isCreateRequested, (requested) => {
    if (!requested) return

    selectedHistoryId.value = -1
    isCreateRequested.value = false
  })

  /**
   * 监听创建完成信号（hasCreatedHistory）：
   * - 若有新创建的 historyId，自动将 selectedHistoryId 切换到该 ID，
   *   让用户立即看到新建的题集；
   * - 之后调用 clearCreatedHistoryState 清除信号，防止重复触发。
   */
  watch(hasCreatedHistory, (isCreated) => {
    if (!isCreated) return

    if (latestCreatedHistoryId.value !== null) {
      selectedHistoryId.value = latestCreatedHistoryId.value
    }

    historyStore.clearCreatedHistoryState()
  })

  /**
   * 组件挂载时加载历史列表。
   * 失败时通过 Toast 弹出错误通知，不影响页面正常渲染（列表为空）。
   */
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

  /**
   * 历史列表筛选条件（subject、tag、status）。
   * 初始无筛选，status 默认为 All（显示全部）。
   */
  const historyFilter = ref<HistoryFilterModel>({
    subject: undefined,
    tag: undefined,
    content: [],
    status: ProgressStatus.All,
  })

  /**
   * 根据筛选条件在本地过滤并排序历史列表（按创建时间降序）。
   * 全部逻辑均在客户端完成，无需额外网络请求。
   */
  const filteredHistories = computed(() => {
    const { subject, tag, status } = historyFilter.value

    return histories.value
      .filter((historyItem) => {
        // subject 为 undefined 时不筛选
        const matchesSubject = !subject || historyItem.subject === subject
        // tag 为 undefined 时不筛选
        const matchesTag = !tag || historyItem.tag === tag
        // All 模式不筛选进度；InProgress 为 progress < 1；Finished 为 progress === 1
        const matchesStatus =
          status === ProgressStatus.All ||
          (status === ProgressStatus.InProgress && historyItem.progress < 1) ||
          (status === ProgressStatus.Finished && historyItem.progress === 1)

        return matchesSubject && matchesTag && matchesStatus
      })
      // 按创建时间降序（最新的在最前面）
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
