<template>
  <div class="flex-1 flex justify-center">
    <Fieldset class="mt-24 w-2/5 max-h-96 mr-44" legend="Want to do some quizzes?">
      <Form
        :initial-values="question"
        :resolver="resolver"
        v-slot="form"
        @submit="onFormSubmit"
        class="flex flex-col justify-between w-full h-64 mt-8 px-4"
      >
        <float-label variant="on" class="w-full">
          <input-text id="subject" class="w-full" name="subject" v-model="question.subject" />
          <label for="subject">Subject</label>
        </float-label>
        <message v-if="form.states.subject?.invalid" severity="error" size="small" variant="simple">
          {{ form.states.subject.error?.message }}
        </message>

        <float-label variant="on" class="w-full">
          <input-text id="tag" class="w-full" name="tag" v-model="question.tag" />
          <label for="tag">Tag</label>
        </float-label>
        <message v-if="form.states.tag?.invalid" severity="error" size="small" variant="simple">
          {{ form.states.tag.error?.message }}
        </message>

        <div class="flex justify-between flex-wrap">
          <float-label variant="on" class="w-2/5">
            <input-number id="number" class="w-full" name="number" v-model="question.number" />
            <label for="number">Number of Questions</label>
          </float-label>
          <select-button
            v-model="question.type"
            size="small"
            :options="questionTypes"
            :default-value="questionTypes[0]"
            name="type"
          />
        </div>
        <Button class="w-full" severity="secondary" type="submit" label="submit">Start Quiz</Button>
      </Form>
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
import { computed, reactive, ref } from 'vue'
import { Form } from '@primevue/forms'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import { storeToRefs } from 'pinia'

const questionTypes = ref(['Single Choice', 'Multiple Choice'])

interface Question {
  subject: string
  tag: string
  number: number
  type: string
}

const question = reactive<Question>({
  subject: '',
  tag: '',
  number: 0,
  type: questionTypes.value[0],
})
const questionType = computed(() => (question.type === 'Single Choice' ? 'single' : 'multi'))

const resolver = ({ values }: { values: Record<string, unknown> }) => {
  const errors: Record<string, Array<{ message: string }>> = {}

  if (!values.subject) errors.subject = [{ message: 'Subject is required.' }]
  if (!values.tag) errors.tag = [{ message: 'Tag is required.' }]

  return { errors }
}

const historyStore = useQuestionHistoryStore()
const { createProgress, isStreaming, createError } = storeToRefs(historyStore)

const onFormSubmit = async ({ valid }: { valid: boolean }) => {
  if (valid) {
    await historyStore.createWithStream(question.subject, question.tag, question.number, questionType.value)
  }
}
</script>

<style scoped></style>
