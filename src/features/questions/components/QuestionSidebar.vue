<template>
  <!-- 侧边栏容器：flex 布局，高度撑满父元素，支持折叠/展开动画 -->
  <div
    :class="[
      'p-2 border rounded-2xl flex h-full min-h-0 border-color bg-surface-0 dark:bg-surface-900 transition-[padding] duration-200 flex-col gap-2',
    ]"
  >
    <!-- 展开状态：显示历史过滤器和历史列表 -->
    <template v-if="!props.collapsed">
      <!-- HistoryFilter：学科/标签过滤 + 进度状态切换 + 新建按钮 -->
      <HistoryFilter
        v-model:create="isCreateRequested"
        v-model:filter="historyFilter"
        :subjects="subjects"
        :tags="tags"
      />

      <!-- HistoryList：可滚动的历史记录列表，支持单击选中、双击删除 -->
      <div class="w-full flex flex-1 min-h-0 overflow-hidden">
        <HistoryList v-model:selected="selectedHistoryId" :histories="filteredHistories" />
      </div>
    </template>

    <!-- 折叠状态：列表区域替换为空白占位，保持布局结构 -->
    <div v-else class="flex-1 w-full" />

    <!-- 折叠/展开按钮：固定在底部，折叠时居中，展开时右对齐 -->
    <div class="w-full flex mt-auto" :class="props.collapsed ? 'justify-center' : 'justify-end'">
      <Button
        :icon="props.collapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'"
        :aria-label="props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        severity="secondary"
        size="small"
        text
        rounded
        @click="emit('toggle-collapse')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：QuestionSidebar）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import HistoryFilter from '@/features/questions/components/history/HistoryFilter.vue'
import HistoryList from '@/features/questions/components/history/HistoryList.vue'
import { useQuestionSidebar } from '@/features/questions/composables/useQuestionSidebar'

const props = withDefaults(
  defineProps<{
    /** 是否处于折叠状态（折叠时隐藏列表内容，仅显示切换按钮） */
    collapsed?: boolean
  }>(),
  {
    collapsed: false,
  },
)

/** 通知父组件切换侧边栏折叠状态 */
const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

/** 当前选中的题集 ID（-1 表示未选中） */
const selectedHistoryId = defineModel<number>('selected', { default: -1 })

// 从 composable 获取创建请求标志、筛选条件、过滤后的历史列表，以及学科和标签选项
const { isCreateRequested, historyFilter, filteredHistories, subjects, tags } = useQuestionSidebar({
  selectedHistoryId,
})
</script>
