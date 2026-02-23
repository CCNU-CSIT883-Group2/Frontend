<template>
  <section class="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p
        class="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-300"
      >
        Learning Dashboard
      </p>
      <h1 class="mt-1 text-2xl font-semibold text-surface-900 dark:text-surface-0">Overview</h1>
      <p class="mt-1 text-sm text-surface-500 dark:text-surface-300">{{ dateRangeLabel }}</p>
    </div>

    <div class="flex items-end gap-3 flex-wrap justify-between lg:justify-end">
      <div class="flex flex-col gap-1">
        <label for="subjects" class="text-sm text-surface-600 dark:text-surface-300">Subject</label>
        <Select
          id="subjects"
          v-model="selectedSubject"
          :disabled="subjects.length === 0"
          :options="subjectOptions"
          option-label="label"
          option-value="value"
          class="w-60"
          placeholder="All subjects"
        />
      </div>

      <Button
        :disabled="subjects.length === 0 || !selectedSubject"
        icon="pi pi-share-alt"
        label="Share"
        severity="secondary"
        @click="emit('share')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 overview 领域的界面展示与交互行为（组件：OverviewToolbar）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { computed } from 'vue'

const props = defineProps<{
  subjects: string[]
  dateRangeLabel: string
}>()

const selectedSubject = defineModel<string>({ default: '' })

const subjectOptions = computed(() => [
  { label: 'All Subjects', value: '' },
  ...props.subjects.map((subject) => ({ label: subject, value: subject })),
])

const emit = defineEmits<{
  share: []
}>()
</script>
