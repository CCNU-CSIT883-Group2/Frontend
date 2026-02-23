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
