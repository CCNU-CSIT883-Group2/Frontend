<template>
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="flex items-center gap-2">
      <label for="subjects" class="text-sm text-surface-600 dark:text-surface-300">Subject</label>
      <Select id="subjects" v-model="subjectProxy" :options="subjects" placeholder="Select subject" class="w-60" />
    </div>
    <Button label="Share" icon="pi pi-share-alt" severity="secondary" @click="emit('share')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  subjects: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  share: []
}>()

const subjectProxy = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>
