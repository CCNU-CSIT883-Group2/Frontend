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
          :options="subjects"
          class="w-60"
          placeholder="Select subject"
        />
      </div>

      <Button
        :disabled="subjects.length === 0"
        icon="pi pi-share-alt"
        label="Share"
        severity="secondary"
        @click="emit('share')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  subjects: string[]
  dateRangeLabel: string
}>()

const selectedSubject = defineModel<string>({ default: '' })

const emit = defineEmits<{
  share: []
}>()
</script>
