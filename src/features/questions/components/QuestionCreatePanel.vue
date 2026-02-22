<template>
  <div class="flex-1 flex justify-center">
    <Fieldset class="mt-24 w-2/5 max-h-96 mr-44" legend="Want to do some quizzes?">
      <form
        class="flex flex-col justify-between w-full h-64 mt-8 px-4"
        @submit.prevent="onFormSubmit"
      >
        <FloatLabel class="w-full" variant="on">
          <InputText id="subject" v-model="formState.subject" class="w-full" name="subject" />
          <label for="subject">Subject</label>
        </FloatLabel>
        <Message v-if="formErrors.subject" severity="error" size="small" variant="simple">
          {{ formErrors.subject }}
        </Message>

        <FloatLabel class="w-full" variant="on">
          <InputText id="tag" v-model="formState.tag" class="w-full" name="tag" />
          <label for="tag">Tag</label>
        </FloatLabel>
        <Message v-if="formErrors.tag" severity="error" size="small" variant="simple">
          {{ formErrors.tag }}
        </Message>

        <div class="flex justify-between flex-wrap">
          <FloatLabel class="w-2/5" variant="on">
            <InputNumber
              id="number"
              v-model="formState.number"
              class="w-full"
              name="number"
              :min="1"
            />
            <label for="number">Number of Questions</label>
          </FloatLabel>

          <Message v-if="formErrors.number" severity="error" size="small" variant="simple">
            {{ formErrors.number }}
          </Message>

          <SelectButton
            v-model="formState.type"
            :options="questionTypes"
            name="type"
            option-label="label"
            option-value="value"
            size="small"
          />
        </div>

        <Button
          :loading="isStreaming"
          :disabled="isStreaming"
          class="w-full"
          label="Start Quiz"
          severity="secondary"
          type="submit"
        />
      </form>

      <div v-if="isStreaming || createProgress.total > 0" class="mt-4 px-4">
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

      <div v-if="createError" class="mt-3 px-4 text-red-600 text-sm">
        {{ createError }}
      </div>
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { storeToRefs } from 'pinia'
import { computed, reactive } from 'vue'

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

interface QuestionCreationFormErrors {
  subject: string
  tag: string
  number: string
}

const formState = reactive<QuestionCreationFormState>({
  subject: '',
  tag: '',
  number: 10,
  type: 'single',
})

const formErrors = reactive<QuestionCreationFormErrors>({
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

  await historyStore.createQuestions(
    formState.subject.trim(),
    formState.tag.trim(),
    questionCount.value,
    formState.type,
  )
}
</script>
