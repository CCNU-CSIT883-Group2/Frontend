<template>
  <div class="flex flex-1">
    <div class="flex justify-between gap-2 flex-1">
      <question-list :questions="questionsList" class="flex-1" :scroll-to="scrollToIndex" v-model:attempts="attempts"
        :answer-saved="answered" />
      <div class="flex-none w-72 p-2 border rounded-2xl flex flex-col gap-2 border-color">
        <div class="flex gap-2 flex-col">
          <span class="font-extrabold px-4 pt-1">Questions: </span>
          <div class="gap-4 grid grid-cols-4 px-4">
            <Button :variant="attempts[i].length === 0 ? 'outlined' : undefined" v-for="(_, i) in questionsList"
              severity="secondary" :key="i" class="w-12 h-12" @click="scrollTo(i)">
              <template #default>
                <div class="flex items-center">
                  <span class="text-center">{{ i + 1 }}</span>
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
import { onUnmounted, ref, watch } from 'vue'
import type { Question } from '@/types'
import { useQuestions } from '@/hooks/useQuestions'
import QuestionList from '@/components/QuestionList.vue'
import { useAttempts } from '@/hooks/useAttempts'

const props = defineProps<{
  historyId: number
}>()

const questionsList = ref<Question[]>([])
const questionsListLength = ref(0)
const attempts = ref<number[][]>([])
const {
  questions: question,
  isFetching: isFetchingQuestion,
  cancel: cancelFetchingQuestion,
} = useQuestions(props.historyId)

const qh = watch(isFetchingQuestion, () => {
  if (!isFetchingQuestion.value) {
    questionsList.value = question.value as Question[]
    attempts.value = questionsList.value.map(() => [])
    questionsListLength.value = questionsList.value.length
    qh.stop()
  }
})

const answered = ref(false)
const {
  attempts: attempt,
  isFetching: isFetchingAttempts,
  cancel: cancelFetchingAttempts,
} = useAttempts(props.historyId)
const ah = watch([isFetchingQuestion, isFetchingAttempts], () => {
  if (!isFetchingAttempts.value && !isFetchingQuestion.value) {
    const attempts_map = new Map<number, number[]>()

    attempt.value.forEach((a) => {
      attempts_map.set(a.question_id, a.user_answers)
    })

    attempts.value = questionsList.value.map((q) => attempts_map.get(q.question_id) ?? [])
    answered.value = attempts.value.every((a) => a.length > 0)

    ah.stop()
  }
})

onUnmounted(() => {
  cancelFetchingQuestion()
  cancelFetchingAttempts()
})

const scrollToIndex = ref(-1)
const scrollTo = (index: number) => {
  scrollToIndex.value = index
}
</script>
