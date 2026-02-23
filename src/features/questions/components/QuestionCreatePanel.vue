<template>
  <div class="flex flex-1 min-h-0 justify-center">
    <section class="mt-4 w-full max-w-[44rem] px-2 py-3 sm:mt-8 sm:px-4 sm:py-5 lg:mt-10 lg:px-6">
      <header class="mb-5 sm:mb-6">
        <p class="text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-300">
          Quiz Setup
        </p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-surface-900 dark:text-surface-0 sm:text-3xl">
          Want to do some quizzes?
        </h2>
        <p class="mt-2 text-sm text-surface-500 dark:text-surface-300 sm:text-base">
          Build a focused question set and start right away.
        </p>
      </header>

      <form class="flex w-full flex-col gap-3.5" @submit.prevent="onFormSubmit">
        <div class="flex flex-col gap-1.5">
          <FloatLabel class="w-full" variant="on">
            <InputText
              id="subject"
              v-model="formState.subject"
              class="w-full"
              name="subject"
              :invalid="Boolean(formErrors.subject)"
              :disabled="isStreaming"
            />
            <label for="subject">Subject</label>
          </FloatLabel>
          <Message v-if="formErrors.subject" severity="error" size="small" variant="simple">
            {{ formErrors.subject }}
          </Message>
        </div>

        <div class="flex flex-col gap-1.5">
          <FloatLabel class="w-full" variant="on">
            <InputText
              id="tag"
              v-model="formState.tag"
              class="w-full"
              name="tag"
              :invalid="Boolean(formErrors.tag)"
              :disabled="isStreaming"
            />
            <label for="tag">Tag</label>
          </FloatLabel>
          <Message v-if="formErrors.tag" severity="error" size="small" variant="simple">
            {{ formErrors.tag }}
          </Message>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex w-full flex-col gap-1.5 sm:w-1/2">
            <FloatLabel class="w-full" variant="on">
              <InputNumber
                id="number"
                v-model="formState.number"
                class="w-full"
                name="number"
                :min="1"
                :invalid="Boolean(formErrors.number)"
                :disabled="isStreaming"
              />
              <label for="number">Number of Questions</label>
            </FloatLabel>

            <Message v-if="formErrors.number" severity="error" size="small" variant="simple">
              {{ formErrors.number }}
            </Message>
          </div>

          <SelectButton v-model="formState.type" :options="questionTypes" class="w-full sm:w-auto" name="type"
            option-label="label" option-value="value" size="small" :disabled="isStreaming" />
        </div>

        <Button :loading="isStreaming" :disabled="isStreaming" class="mt-1 w-full" label="Start Quiz" severity="primary"
          type="submit" />
      </form>

      <div v-if="isStreaming || createProgress.total > 0" class="mt-5 pb-5">
        <div class="mb-1 text-sm font-medium text-surface-700 dark:text-surface-200">
          Generating questions: {{ createProgress.current }} / {{ createProgress.total }} ({{
            createProgress.percent
          }}%)
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
          <div class="h-full bg-primary transition-all" :style="{ width: `${createProgress.percent}%` }"></div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, reactive, watch } from 'vue'

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
const toast = useToast()

const questionCount = computed(() => Number(formState.number) || 0)

watch(createError, (message) => {
  if (!message) return

  toast.add({
    severity: 'error',
    summary: 'Create quiz failed',
    detail: message,
    life: 3500,
  })
})

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
