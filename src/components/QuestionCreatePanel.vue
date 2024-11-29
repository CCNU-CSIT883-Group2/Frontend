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
        <message v-if="form.subject?.invalid" severity="error" size="small" variant="simple">
          {{ form.subject.error?.message }}
        </message>

        <float-label variant="on" class="w-full">
          <input-text id="tag" class="w-full" name="tag" v-model="question.tag" />
          <label for="tag">Tag</label>
        </float-label>
        <message v-if="form.tag?.invalid" severity="error" size="small" variant="simple">
          {{ form.tag.error?.message }}
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
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Form } from '@primevue/forms'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'

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

const resolver = ({ values }) => {
  const errors = {}

  if (!values.subject) errors.subject = [{ message: 'Subject is required.' }]
  if (!values.tag) errors.tag = [{ message: 'Tag is required.' }]

  return { errors }
}

const historyStore = useQuestionHistoryStore()

const onFormSubmit = ({ valid }) => {
  if (valid) {
    historyStore.add(question.subject, question.tag, question.number, questionType.value)
  }
}
</script>

<style scoped></style>
