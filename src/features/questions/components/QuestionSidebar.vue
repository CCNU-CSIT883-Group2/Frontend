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
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { ProgressStatus, type HistoryFilter as HistoryFilterModel } from '@/types'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, onMounted, ref, watch } from 'vue'

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

const toast = useToast()

const selectedHistoryId = defineModel<number>('selected', { default: -1 })
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
    .sort((a, b) => b.create_time - a.create_time)
})
</script>
