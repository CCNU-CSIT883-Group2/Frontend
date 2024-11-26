<template>
  <div class="flex flex-col gap-2">
    <float-label variant="on">
      <Select
        v-model="selectedSubjects"
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

    <div class="flex justify-between gap-2">
      <float-label class="flex-1" variant="on">
        <Select
          v-model="selectedTags"
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
        v-model="progress"
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
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{ filter?: HistoryFilter; subjects?: string[]; tags?: string[] }>(),
  {
    subjects: () => [],
    tags: () => [],
  },
)

const filter = defineModel<HistoryFilter>('filter', {
  default: { content: [], status: ProgressStatus.All },
})

// Subject
const selectedSubjects = ref<string | null>()

watch(selectedSubjects, (value) => {
  if (value !== null) {
    filter.value = { ...filter.value, subject: value }
    return
  }
  filter.value = { ...filter.value, subject: '' }
})

// Tag
const selectedTags = ref<string | null>()

watch(selectedTags, (value) => {
  if (value !== null) {
    filter.value = { ...filter.value, tag: value }
    return
  }
  filter.value = { ...filter.value, tag: '' }
})

// Progress
const progress = ref<{ icon: string; value: ProgressStatus } | null>()

watch(progress, (value) => {
  let status = ProgressStatus.All

  if (value !== null && value !== undefined) {
    status = value.value
  }

  filter.value = { ...filter.value, status }
})

const progressOption = ref([
  { icon: 'pi pi-circle', value: ProgressStatus.InProgress },
  { icon: 'pi pi-check-circle', value: ProgressStatus.Finished },
])
</script>

<style scoped></style>
