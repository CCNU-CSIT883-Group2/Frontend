<template>
  <div class="flex flex-1">
    <div class="flex justify-between gap-2 flex-1">
      <question-list
        class="flex-1"
        :questions="questionsList"
        v-model:scroll-to="scrollToIndex"
        v-model:answer-saved="answered"
        v-model:attempts="attempts"
      />

      <div class="flex-none w-72 p-2 border rounded-2xl flex flex-col gap-2 border-color">
        <div class="flex gap-2 flex-col">
          <span class="font-extrabold px-4 pt-1">Questions:</span>

          <div class="gap-4 grid grid-cols-4 px-4">
            <Button
              v-for="(_, index) in questionsList"
              :key="index"
              :variant="attempts[index]?.length === 0 ? 'outlined' : undefined"
              severity="secondary"
              class="w-12 h-12"
              @click="scrollTo(index)"
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
import QuestionList from '@/components/QuestionList.vue'
import { useAttempts } from '@/hooks/useAttempts'
import { useQuestions } from '@/hooks/useQuestions'
import type { Question } from '@/types'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  historyId: number
}>()

const questionsList = ref<Question[]>([])
const attempts = ref<number[][]>([])
const answered = ref(false)

const {
  questions,
  isFetching: isFetchingQuestions,
  cancel: cancelFetchingQuestions,
} = useQuestions(props.historyId)

const {
  attempts: fetchedAttempts,
  isFetching: isFetchingAttempts,
  cancel: cancelFetchingAttempts,
} = useAttempts(props.historyId)

watch(
  isFetchingQuestions,
  (loading) => {
    if (loading) return
    questionsList.value = questions.value
    attempts.value = questions.value.map(() => [])
  },
  { immediate: true },
)

watch(
  [isFetchingQuestions, isFetchingAttempts],
  ([questionsLoading, attemptsLoading]) => {
    if (questionsLoading || attemptsLoading) return

    const attemptsByQuestionId = new Map<number, number[]>()
    fetchedAttempts.value.forEach((attemptItem) => {
      attemptsByQuestionId.set(attemptItem.question_id, attemptItem.user_answers)
    })

    attempts.value = questionsList.value.map(
      (question) => attemptsByQuestionId.get(question.question_id) ?? [],
    )
    answered.value = attempts.value.every((attempt) => attempt.length > 0)
  },
  { immediate: true },
)

onUnmounted(() => {
  cancelFetchingQuestions()
  cancelFetchingAttempts()
})

const scrollToIndex = ref(-1)
const scrollTo = (index: number) => {
  scrollToIndex.value = index
}
</script>
