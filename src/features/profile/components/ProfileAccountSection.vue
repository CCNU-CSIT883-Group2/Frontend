<template>
  <section
    class="rounded-2xl border border-surface-200 bg-surface-0 p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900"
  >
    <header class="mb-4">
      <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Basic information</h2>
      <p class="text-sm text-surface-500 dark:text-surface-300">
        Update the public profile fields used across your workspace.
      </p>
    </header>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <FloatLabel variant="on" class="w-full">
            <InputText
              id="profile-name-edit"
              ref="nameInput"
              v-model="nameModel"
              class="w-full !bg-transparent disabled:!bg-transparent"
              autocomplete="name"
              :disabled="!isEditingName || isSavingName"
              @blur="commitField('name')"
              @keydown.enter.prevent="commitField('name')"
              @keydown.esc.prevent="cancelEdit('name')"
            />
            <label for="profile-name-edit">Display name</label>
          </FloatLabel>
          <Button
            v-if="isEditingName"
            label="Cancel"
            icon="pi pi-times"
            text
            size="small"
            severity="secondary"
            class="shrink-0"
            :disabled="isSavingName"
            @mousedown="prepareCancel('name')"
            @click="cancelEdit('name')"
          />
          <Button
            v-else
            label="Edit"
            icon="pi pi-pencil"
            text
            size="small"
            class="shrink-0"
            :disabled="isSavingName"
            @click="startEdit('name')"
          />
        </div>
        <p v-if="nameError" class="text-sm text-red-500">{{ nameError }}</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <FloatLabel variant="on" class="w-full">
            <InputText
              id="profile-email-edit"
              ref="emailInput"
              v-model="emailModel"
              class="w-full !bg-transparent disabled:!bg-transparent"
              autocomplete="email"
              type="email"
              :disabled="!isEditingEmail || isSavingEmail"
              @blur="commitField('email')"
              @keydown.enter.prevent="commitField('email')"
              @keydown.esc.prevent="cancelEdit('email')"
            />
            <label for="profile-email-edit">Email address</label>
          </FloatLabel>
          <Button
            v-if="isEditingEmail"
            label="Cancel"
            icon="pi pi-times"
            text
            size="small"
            severity="secondary"
            class="shrink-0"
            :disabled="isSavingEmail"
            @mousedown="prepareCancel('email')"
            @click="cancelEdit('email')"
          />
          <Button
            v-else
            label="Edit"
            icon="pi pi-pencil"
            text
            size="small"
            class="shrink-0"
            :disabled="isSavingEmail"
            @click="startEdit('email')"
          />
        </div>
        <p v-if="emailError" class="text-sm text-red-500">{{ emailError }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import { nextTick, reactive, ref, useTemplateRef } from 'vue'

type EditableField = 'name' | 'email'

interface ProfileAccountSectionProps {
  nameError: string
  emailError: string
  isSavingName: boolean
  isSavingEmail: boolean
}

const props = defineProps<ProfileAccountSectionProps>()

const emit = defineEmits<{
  saveName: []
  saveEmail: []
}>()

const nameModel = defineModel<string>('name', { default: '' })
const emailModel = defineModel<string>('email', { default: '' })

const isEditingName = ref(false)
const isEditingEmail = ref(false)
const fieldSnapshot = reactive<Record<EditableField, string>>({
  name: '',
  email: '',
})
const pendingCancelField = ref<EditableField | null>(null)
const nameInput = useTemplateRef<HTMLInputElement>('nameInput')
const emailInput = useTemplateRef<HTMLInputElement>('emailInput')

const setEditing = (field: EditableField, value: boolean) => {
  if (field === 'name') {
    isEditingName.value = value
    return
  }

  isEditingEmail.value = value
}

const getFieldValue = (field: EditableField) => {
  if (field === 'name') return nameModel.value
  return emailModel.value
}

const setFieldValue = (field: EditableField, value: string) => {
  if (field === 'name') {
    nameModel.value = value
    return
  }

  emailModel.value = value
}

const startEdit = (field: EditableField) => {
  if (field === 'name' && props.isSavingName) return
  if (field === 'email' && props.isSavingEmail) return

  fieldSnapshot[field] = getFieldValue(field)
  setEditing(field, true)

  nextTick(() => {
    if (field === 'name') {
      nameInput.value?.focus()
      return
    }

    emailInput.value?.focus()
  })
}

const cancelEdit = (field: EditableField) => {
  pendingCancelField.value = null
  setFieldValue(field, fieldSnapshot[field])
  setEditing(field, false)
}

const prepareCancel = (field: EditableField) => {
  pendingCancelField.value = field
}

const commitField = (field: EditableField) => {
  if ((field === 'name' && !isEditingName.value) || (field === 'email' && !isEditingEmail.value)) {
    return
  }

  if (pendingCancelField.value === field) {
    pendingCancelField.value = null
    return
  }

  if (field === 'name') {
    if (props.isSavingName || props.nameError) return
    nameModel.value = nameModel.value.trim()
    if (nameModel.value === fieldSnapshot.name) {
      setEditing('name', false)
      return
    }
    emit('saveName')
    setEditing('name', false)
    return
  }

  if (props.isSavingEmail || props.emailError) return
  emailModel.value = emailModel.value.trim()
  if (emailModel.value === fieldSnapshot.email) {
    setEditing('email', false)
    return
  }
  emit('saveEmail')
  setEditing('email', false)
}
</script>
