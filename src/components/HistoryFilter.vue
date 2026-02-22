<template>
  <div class="flex flex-col gap-2">
    <div class="flex justify-between gap-2">
      <float-label variant="on" class="flex-1">
        <Select
          v-model="selectedSubject"
          :options="subjects"
          filter
          class="w-full border-color rounded-lg shadow-none"
          labelClass="text-sm"
          size="small"
          :highlightOnSelect="false"
          resetFilterOnHide
          showClear
          checkmark
        >
          <template #option="slot">
            <span class="text-xsm font-bold"> {{ slot.option }} </span>
          </template>
        </Select>
        <label class="text-xsm">Subject</label>
      </float-label>
      <Button size="small" icon="pi pi-plus" severity="secondary" @click="create = true"></Button>
    </div>

    <div class="flex justify-between gap-2">
      <float-label class="flex-1" variant="on">
        <Select
          v-model="selectedTag"
          :options="tags"
          filter
          class="w-full border-color rounded-lg shadow-none"
          size="small"
          labelClass="text-sm"
          :highlightOnSelect="false"
          resetFilterOnHide
          showClear
          checkmark
        >
          <template #option="slot">
            <span class="text-xsm font-bold"> {{ slot.option }} </span>
          </template>
        </Select>
        <label class="text-xsm">Tag</label>
      </float-label>

      <select-button
        :options="progressOption"
        size="small"
        v-model="selectedProgress"
        optionLabel="value"
        dataKey="value"
      >
        <template #option="slot">
          <i :class="slot.option.icon"></i>
        </template>
      </select-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type HistoryFilter, ProgressStatus } from '@/types'
import { computed } from 'vue'

withDefaults(defineProps<{ subjects?: string[]; tags?: string[] }>(), {
  subjects: () => [],
  tags: () => [],
})

const create = defineModel<boolean>('create', { default: false })

const filter = defineModel<HistoryFilter>('filter', {
  default: { content: [], status: ProgressStatus.All },
})

// Subject
const selectedSubject = computed<string | null>({
  get: () => filter.value.subject ?? null,
  set: (value) => {
    filter.value = { ...filter.value, subject: value ?? '' }
  },
})

// Tag
const selectedTag = computed<string | null>({
  get: () => filter.value.tag ?? null,
  set: (value) => {
    filter.value = { ...filter.value, tag: value ?? '' }
  },
})

// Progress
const progressOption = [
  { icon: 'pi pi-circle', value: ProgressStatus.InProgress },
  { icon: 'pi pi-check-circle', value: ProgressStatus.Finished },
]

const selectedProgress = computed<{ icon: string; value: ProgressStatus } | null>({
  get: () =>
    progressOption.find((option) => option.value === filter.value.status) ?? null,
  set: (value) => {
    filter.value = { ...filter.value, status: value?.value ?? ProgressStatus.All }
  },
})
</script>

<style scoped></style>
