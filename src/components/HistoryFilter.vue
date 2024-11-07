<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center p-2 rounded-xl border-color">
      <div class="gap-1 flex flex-wrap">
        <Tag v-for="(tag, index) in searchContent" :key="index" severity="contrast">
          {{ tag }}
          <button @click="removeTag(index)">
            <i class="pi pi-times" style="font-size: 0.75rem"></i>
          </button>
        </Tag>
      </div>
      <input
        v-model="input"
        class="border-0 outline-0 p-1 text-sm flex-1 bg-transparent"
        placeholder="Search Question"
        @blur="addTag"
        @keydown.enter.prevent="addTag"
        @keydown.backspace="removeLastTag"
      />
    </div>

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
    filter: () => {
      return { content: [], status: ProgressStatus.All }
    },
  },
)

const emit = defineEmits(['update:filter'])

// Tag input
const searchContent = ref<Array<string>>([])
const input = ref('')

function addTag() {
  const tag = input.value.trim()
  input.value = ''
  if (tag && !searchContent.value.includes(tag)) {
    searchContent.value.push(tag)
  }
  emit('update:filter', { ...props.filter, tags: searchContent.value })
}

function removeTag(index: number) {
  searchContent.value.splice(index, 1)
}

function removeLastTag() {
  if (!input.value && searchContent.value.length > 0) {
    searchContent.value.pop()
  }
}

// Subject
const selectedSubjects = ref<string | null>()

watch(selectedSubjects, (value) => {
  if (value !== null) {
    return emit('update:filter', { ...props.filter, subject: value })
  }
  emit('update:filter', { ...props.filter, subject: '' })
})

// Tag
const selectedTags = ref<string | null>()

watch(selectedTags, (value) => {
  if (value !== null) {
    return emit('update:filter', { ...props.filter, tag: value })
  }
  emit('update:filter', { ...props.filter, tag: '' })
})

// Progress
const progress = ref<{ icon: string; value: ProgressStatus } | null>()

watch(progress, (value) => {
  let status = ProgressStatus.All

  if (value !== null && value !== undefined) {
    status = value.value
  }

  emit('update:filter', { ...props.filter, status })
})

const progressOption = ref([
  { icon: 'pi pi-circle', value: ProgressStatus.InProgress },
  { icon: 'pi pi-check-circle', value: ProgressStatus.Finished },
])
</script>

<style scoped></style>
