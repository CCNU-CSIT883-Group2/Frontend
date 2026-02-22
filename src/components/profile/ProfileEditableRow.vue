<template>
  <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
    <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg">
      {{ label }}
    </div>

    <div v-if="!editing" class="text-surface-900 dark:text-surface-0 w-full md:w-8/12">
      {{ modelValue }}
    </div>

    <div v-else class="w-full md:w-8/12">
      <InputText
        :model-value="modelValue"
        :type="type"
        class="w-full h-10 text-lg"
        @update:model-value="onUpdateModelValue"
      />
    </div>

    <div class="w-6/12 md:w-2/12 flex justify-end">
      <Button
        v-if="!editing"
        label="Edit"
        icon="pi pi-pencil"
        text
        @click="emit('toggle')"
      />
      <Button v-else label="Save" icon="pi pi-check" text @click="emit('save')" />
    </div>
  </li>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

withDefaults(
  defineProps<{
    label: string
    modelValue: string
    editing: boolean
    type?: string
  }>(),
  {
    type: 'text',
  },
)

const emit = defineEmits<{
  toggle: []
  save: []
  'update:modelValue': [value: string]
}>()

const onUpdateModelValue = (value: string | undefined) => {
  emit('update:modelValue', value ?? '')
}
</script>
