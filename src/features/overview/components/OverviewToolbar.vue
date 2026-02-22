<template>
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-2">
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
</template>

<script setup lang="ts">
defineProps<{
  subjects: string[]
}>()

const selectedSubject = defineModel<string>({ default: '' })

const emit = defineEmits<{
  share: []
}>()
</script>
