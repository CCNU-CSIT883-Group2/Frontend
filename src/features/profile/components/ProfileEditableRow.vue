<template>
  <li class="flex items-center py-5 px-3 border-t border-surface flex-wrap">
    <div class="text-surface-500 dark:text-surface-300 w-6/12 md:w-2/12 font-medium text-lg">
      {{ label }}
    </div>

    <div v-if="!isEditing" class="text-surface-900 dark:text-surface-0 w-full md:w-8/12">
      {{ fieldValue }}
    </div>

    <div v-else class="w-full md:w-8/12">
      <InputText v-model="fieldValue" :type="type" class="w-full h-10 text-lg" />
    </div>

    <div class="w-6/12 md:w-2/12 flex justify-end">
      <Button v-if="!isEditing" icon="pi pi-pencil" label="Edit" text @click="emit('toggle')" />
      <Button v-else icon="pi pi-check" label="Save" text @click="emit('save')" />
    </div>
  </li>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

interface ProfileEditableRowProps {
  label: string
  isEditing: boolean
  type?: string
}

withDefaults(defineProps<ProfileEditableRowProps>(), {
  type: 'text',
})

const fieldValue = defineModel<string>({ default: '' })

const emit = defineEmits<{
  toggle: []
  save: []
}>()
</script>
