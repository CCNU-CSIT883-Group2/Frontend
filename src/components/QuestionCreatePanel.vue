<template>
  <div class="flex-1 flex justify-center">
    <Fieldset class="mt-24 w-2/5 max-h-96 mr-44" legend="Want to do some quizzes?">
      <form
        class="flex flex-col justify-between w-full h-64 mt-8 px-4"
        @submit.prevent="onFormSubmit"
      >
        <float-label variant="on" class="w-full">
          <input-text id="subject" class="w-full" name="subject" v-model="formState.subject" />
          <label for="subject">Subject</label>
        </float-label>
        <message v-if="formErrors.subject" severity="error" size="small" variant="simple">
          {{ formErrors.subject }}
        </message>

        <float-label variant="on" class="w-full">
          <input-text id="tag" class="w-full" name="tag" v-model="formState.tag" />
          <label for="tag">Tag</label>
        </float-label>
        <message v-if="formErrors.tag" severity="error" size="small" variant="simple">
          {{ formErrors.tag }}
        </message>

        <div class="flex justify-between flex-wrap">
          <float-label variant="on" class="w-2/5">
            <input-number
              id="number"
              class="w-full"
              name="number"
              :min="1"
              v-model="formState.number"
            />
            <label for="number">Number of Questions</label>
          </float-label>
          <message v-if="formErrors.number" severity="error" size="small" variant="simple">
            {{ formErrors.number }}
          </message>
          <select-button
            v-model="formState.type"
            size="small"
            :options="questionTypes"
            option-label="label"
            option-value="value"
            name="type"
          />
        </div>
        <Button
          class="w-full"
          severity="secondary"
          type="submit"
          label="Start Quiz"
          :loading="isStreaming"
          :disabled="isStreaming"
        />
      </form>
      <div class="mt-4 px-4" v-if="isStreaming || createProgress.total > 0">
        <div class="text-sm mb-1">
          Generating questions: {{ createProgress.current }} / {{ createProgress.total }} ({{
            createProgress.percent
          }}%)
        </div>
        <div class="h-2 rounded bg-surface-200 dark:bg-surface-700 overflow-hidden">
          <div
            class="h-full bg-primary transition-all"
            :style="{ width: `${createProgress.percent}%` }"
          ></div>
        </div>
      </div>
      <div class="mt-3 px-4 text-red-600 text-sm" v-if="createError">
        {{ createError }}
      </div>
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import { storeToRefs } from 'pinia'

type QuestionKind = 'single' | 'multi'

const questionTypes: Array<{ label: string; value: QuestionKind }> = [
  { label: 'Single Choice', value: 'single' },
  { label: 'Multiple Choice', value: 'multi' },
]

interface QuestionCreationFormState {
  subject: string
  tag: string
  number: number | null
  type: QuestionKind
}

const formState = reactive<QuestionCreationFormState>({
  subject: '',
  tag: '',
  number: 10,
  type: 'single',
})

const formErrors = reactive({
  subject: '',
  tag: '',
  number: '',
})

const historyStore = useQuestionHistoryStore()
const { createProgress, isStreaming, createError } = storeToRefs(historyStore)

const questionCount = computed(() => Number(formState.number) || 0)

const validateForm = () => {
  formErrors.subject = formState.subject.trim() ? '' : 'Subject is required.'
  formErrors.tag = formState.tag.trim() ? '' : 'Tag is required.'
  formErrors.number = questionCount.value > 0 ? '' : 'Question count must be greater than 0.'

  return !formErrors.subject && !formErrors.tag && !formErrors.number
}

const onFormSubmit = async () => {
  if (!validateForm()) return

  await historyStore.createWithStream(
    formState.subject.trim(),
    formState.tag.trim(),
    questionCount.value,
    formState.type,
  )
}
</script>

<style scoped></style>
