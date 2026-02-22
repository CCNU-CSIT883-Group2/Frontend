<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap justify-between gap-2 sm:flex-nowrap">
      <FloatLabel class="flex-1" variant="on">
        <Select
          v-model="selectedSubject"
          :options="subjects"
          class="w-full border-color rounded-lg shadow-none"
          labelClass="text-sm"
          size="small"
          filter
          :highlight-on-select="false"
          reset-filter-on-hide
          show-clear
          checkmark
        >
          <template #option="slot">
            <span class="text-xsm font-bold">{{ slot.option }}</span>
          </template>
        </Select>
        <label class="text-xsm">Subject</label>
      </FloatLabel>

      <Button
        icon="pi pi-plus"
        class="shrink-0"
        severity="secondary"
        size="small"
        @click="isCreateRequested = true"
      />
    </div>

    <div class="flex flex-wrap justify-between gap-2 sm:flex-nowrap">
      <FloatLabel class="flex-1" variant="on">
        <Select
          v-model="selectedTag"
          :options="tags"
          class="w-full border-color rounded-lg shadow-none"
          labelClass="text-sm"
          size="small"
          filter
          :highlight-on-select="false"
          reset-filter-on-hide
          show-clear
          checkmark
        >
          <template #option="slot">
            <span class="text-xsm font-bold">{{ slot.option }}</span>
          </template>
        </Select>
        <label class="text-xsm">Tag</label>
      </FloatLabel>

      <SelectButton
        v-model="selectedProgress"
        :options="progressStatusOptions"
        class="shrink-0"
        data-key="value"
        option-label="value"
        size="small"
      >
        <template #option="slot">
          <i :class="slot.option.icon"></i>
        </template>
      </SelectButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type HistoryFilter, ProgressStatus } from '@/types'
import { computed } from 'vue'

withDefaults(
  defineProps<{
    subjects?: string[]
    tags?: string[]
  }>(),
  {
    subjects: () => [],
    tags: () => [],
  },
)

const isCreateRequested = defineModel<boolean>('create', { default: false })
const historyFilter = defineModel<HistoryFilter>('filter', {
  default: {
    subject: undefined,
    tag: undefined,
    content: [],
    status: ProgressStatus.All,
  },
})

const selectedSubject = computed<string | null>({
  get: () => historyFilter.value.subject ?? null,
  set: (value) => {
    historyFilter.value = {
      ...historyFilter.value,
      subject: value ?? undefined,
    }
  },
})

const selectedTag = computed<string | null>({
  get: () => historyFilter.value.tag ?? null,
  set: (value) => {
    historyFilter.value = {
      ...historyFilter.value,
      tag: value ?? undefined,
    }
  },
})

const progressStatusOptions = [
  { icon: 'pi pi-circle', value: ProgressStatus.InProgress },
  { icon: 'pi pi-check-circle', value: ProgressStatus.Finished },
]

const selectedProgress = computed<{ icon: string; value: ProgressStatus } | null>({
  get: () =>
    progressStatusOptions.find((option) => option.value === historyFilter.value.status) ?? null,
  set: (value) => {
    historyFilter.value = {
      ...historyFilter.value,
      status: value?.value ?? ProgressStatus.All,
    }
  },
})
</script>
