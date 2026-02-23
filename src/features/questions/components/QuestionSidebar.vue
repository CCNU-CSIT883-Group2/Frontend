<template>
  <div
    :class="[
      'p-2 border rounded-2xl flex h-full min-h-0 border-color bg-surface-0 dark:bg-surface-900 transition-[padding] duration-200 flex-col gap-2',
    ]"
  >
    <template v-if="!props.collapsed">
      <HistoryFilter
        v-model:create="isCreateRequested"
        v-model:filter="historyFilter"
        :subjects="subjects"
        :tags="tags"
      />

      <div class="w-full flex flex-1 min-h-0 overflow-hidden">
        <HistoryList v-model:selected="selectedHistoryId" :histories="filteredHistories" />
      </div>
    </template>

    <div v-else class="flex-1 w-full" />

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
    collapsed?: boolean
  }>(),
  {
    collapsed: false,
  },
)

const emit = defineEmits<{
  (e: 'toggle-collapse'): void
}>()

const selectedHistoryId = defineModel<number>('selected', { default: -1 })
const { isCreateRequested, historyFilter, filteredHistories, subjects, tags } = useQuestionSidebar({
  selectedHistoryId,
})
</script>
