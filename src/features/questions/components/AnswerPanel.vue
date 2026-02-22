<template>
  <div class="flex flex-1">
    <div class="flex justify-between gap-2 flex-1">
      <QuestionList
        v-model:attempts="attempts"
        v-model:is-answer-saved="isAnswerSaved"
        v-model:scroll-to="scrollToIndex"
        :questions="questions"
        class="flex-1"
      />

      <div class="flex-none w-72 p-2 border rounded-2xl flex flex-col gap-2 border-color">
        <div class="flex gap-2 flex-col">
          <span class="font-extrabold px-4 pt-1">Questions:</span>

          <div class="gap-4 grid grid-cols-4 px-4">
            <Button
              v-for="(_, index) in questions"
              :key="index"
              :variant="attempts[index]?.length === 0 ? 'outlined' : undefined"
              class="w-12 h-12"
              severity="secondary"
              @click="scrollToQuestion(index)"
            >
              <template #default>
                <div class="flex items-center">
                  <span class="text-center">{{ index + 1 }}</span>
                </div>
              </template>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionList from '@/features/questions/components/QuestionList.vue'
import { useAttempts } from '@/features/questions/composables/useAttempts'
import { useQuestions } from '@/features/questions/composables/useQuestions'
import type { Question } from '@/types'
import { onUnmounted, ref, watch } from 'vue'

interface AnswerPanelProps {
  historyId: number
}

const props = defineProps<AnswerPanelProps>()

const questions = ref<Question[]>([])
const attempts = ref<number[][]>([])
const isAnswerSaved = ref(false)

const {
  questions: fetchedQuestions,
  isFetching: isFetchingQuestions,
  cancel: cancelFetchingQuestions,
} = useQuestions(props.historyId)

const {
  attempts: fetchedAttempts,
  isFetching: isFetchingAttempts,
  cancel: cancelFetchingAttempts,
} = useAttempts(props.historyId)

watch(
  [isFetchingQuestions, fetchedQuestions],
  ([isQuestionsLoading]) => {
    if (isQuestionsLoading) return

    questions.value = fetchedQuestions.value
    attempts.value = fetchedQuestions.value.map(() => [])
  },
  { immediate: true },
)

watch(
  [isFetchingQuestions, isFetchingAttempts, fetchedAttempts],
  ([isQuestionsLoading, isAttemptsLoading]) => {
    if (isQuestionsLoading || isAttemptsLoading) return

    const attemptsByQuestionId = new Map<number, number[]>()
    fetchedAttempts.value.forEach((attemptItem) => {
      attemptsByQuestionId.set(attemptItem.question_id, attemptItem.user_answers)
    })

    attempts.value = questions.value.map(
      (question) => attemptsByQuestionId.get(question.question_id) ?? [],
    )
    isAnswerSaved.value = attempts.value.every((attempt) => attempt.length > 0)
  },
  { immediate: true },
)

onUnmounted(() => {
  cancelFetchingQuestions()
  cancelFetchingAttempts()
})

const scrollToIndex = ref(-1)
const scrollToQuestion = (questionIndex: number) => {
  scrollToIndex.value = questionIndex
}
</script>
