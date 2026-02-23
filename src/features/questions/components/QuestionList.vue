<template>
  <div class="flex min-h-0 flex-col">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <span v-show="settings.questions.showTime" class="font-bold">Time Used:</span>
        <span v-show="settings.questions.showTime" class="font-mono">{{ elapsedTime }}</span>
      </div>

      <div class="flex w-full justify-end gap-2 sm:w-auto sm:gap-4">
        <Button :disabled="disableSubmit" label="Submit" severity="primary" size="small" @click="submitAnswers" />
        <Button icon="pi pi-refresh" severity="secondary" size="small" @click="resetState" />
      </div>
    </div>

    <div class="overflow-y-auto flex-1 no-scrollbar">
      <TransitionGroup name="question-card" tag="div" appear class="relative">
        <QuestionListItem
          v-for="(question, index) in questions"
          :key="question.question_id"
          ref="questionRef"
          v-model:attempt="attempts[index]"
          v-model:is-collapsed="collapsedStates[index]"
          v-model:reset-token="resetToken"
          :is-answered="answeredStates[index]"
          :no="index + 1"
          :question="question"
          :style="{ '--question-enter-delay': `${Math.min(index, 6) * 24}ms` }"
          class="my-2 mx-3"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionListItem from '@/features/questions/components/QuestionListItem.vue'
import { useQuestionElapsedTimer } from '@/features/questions/composables/useQuestionElapsedTimer'
import { useQuestionListState } from '@/features/questions/composables/useQuestionListState'
import { useSubmit } from '@/features/questions/composables/useSubmit'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { useUserSettingsStore } from '@/stores/userStore'
import type { Question } from '@/types'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import {
  computed,
  nextTick,
  type ComponentPublicInstance,
  useTemplateRef,
  watch,
} from 'vue'

interface QuestionListProps {
  questions?: Question[]
}

const props = withDefaults(defineProps<QuestionListProps>(), {
  questions: () => [] as Question[],
})

const questions = computed(() => props.questions)

const isAnswerSaved = defineModel<boolean>('isAnswerSaved', { default: false })
const scrollToQuestionIndex = defineModel<number>('scrollTo', { default: -1 })
const attempts = defineModel<number[][]>('attempts', { default: () => [] as number[][] })
const questionRef = useTemplateRef<ComponentPublicInstance[]>('questionRef')

const { resetToken, collapsedStates, answeredStates, resetState: resetQuestionState } =
  useQuestionListState({
    questions,
    attempts,
    isAnswerSaved,
  })

const { elapsedTime, resetElapsedTime } = useQuestionElapsedTimer({
  isAnswerSaved,
  questionCount: computed(() => questions.value.length),
})

const { settings } = storeToRefs(useUserSettingsStore())
const historyStore = useQuestionHistoryStore()
const toast = useToast()
const { submit, isSubmitting } = useSubmit()

const disableSubmit = computed(() => {
  if (isAnswerSaved.value) return true
  if (questions.value.length === 0) return true
  if (isSubmitting.value) return true
  return attempts.value.some((attempt) => attempt.length === 0)
})

const submitAnswers = async () => {
  if (disableSubmit.value) return

  const firstQuestion = questions.value[0]
  if (!firstQuestion) return

  const questionIds = questions.value.map((question) => question.question_id)
  const submitResult = await submit({
    historyId: firstQuestion.history_id,
    type: firstQuestion.type,
    questionIds,
    answers: attempts.value,
  })

  answeredStates.value = questionIds.map(
    (questionId) => submitResult.answeredMap.get(questionId) === true,
  )
  isAnswerSaved.value = answeredStates.value.every(Boolean)

  if (submitResult.failureCount > 0) {
    const hasAnySuccess = submitResult.successCount > 0
    const summary = hasAnySuccess ? 'Partial submission' : 'Submit failed'
    const detail = hasAnySuccess
      ? `${submitResult.successCount}/${questionIds.length} answers were saved. ${submitResult.firstError ?? ''}`.trim()
      : (submitResult.firstError ?? 'Unable to submit answers. Please try again.')

    toast.add({
      severity: hasAnySuccess ? 'warn' : 'error',
      summary,
      detail,
      life: 3500,
    })
  }

  if (isAnswerSaved.value) {
    historyStore.updateHistoryProgress(firstQuestion.history_id, 1)
    void historyStore.fetchHistories()
  }
}

const resetState = () => {
  resetQuestionState()
  resetElapsedTime()
}

const scrollToQuestion = async (index: number) => {
  if (index < 0 || index >= questions.value.length) return

  collapsedStates.value = collapsedStates.value.map(
    (collapsed, currentIndex) => (currentIndex === index ? false : collapsed),
  )
  await nextTick()

  const target = questionRef.value?.[index]
  const targetElement = target?.$el as HTMLElement | undefined
  targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(scrollToQuestionIndex, (index) => {
  if (index < 0) return

  void scrollToQuestion(index)
  scrollToQuestionIndex.value = -1
})
</script>

<style scoped>
.question-card-enter-active {
  transition:
    opacity 180ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--question-enter-delay, 0ms);
}

.question-card-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
}

.question-card-enter-from,
.question-card-leave-to {
  opacity: 0.5;
  transform: translateX(32px);
}

.question-card-move {
  transition: transform 220ms ease;
}

@media (prefers-reduced-motion: reduce) {

  .question-card-enter-active,
  .question-card-leave-active,
  .question-card-move {
    transition: none;
  }
}
</style>
