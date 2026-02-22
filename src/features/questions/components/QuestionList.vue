<template>
  <div class="flex flex-col">
    <div class="flex justify-between mb-2 gap-2 items-center">
      <div class="flex gap-2">
        <span v-show="settings.questions.showTime" class="font-bold">Time Used:</span>
        <span v-show="settings.questions.showTime" class="font-mono">{{ elapsedTime }}</span>
      </div>

      <div class="flex gap-4">
        <Button
          :disabled="disableSubmit"
          label="Submit"
          severity="primary"
          size="small"
          @click="submitAnswers"
        />
        <Button icon="pi pi-refresh" severity="secondary" size="small" @click="resetState" />
      </div>
    </div>

    <div ref="panel" class="overflow-y-auto flex-1 no-scrollbar">
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
        class="my-2 mx-3"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionListItem from '@/features/questions/components/QuestionListItem.vue'
import { useSubmit } from '@/features/questions/composables/useSubmit'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { useUserSettingsStore } from '@/stores/userStore'
import type { Question } from '@/types'
import { useDebounceFn, useIntervalFn, useScroll } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import {
  computed,
  onUnmounted,
  ref,
  shallowRef,
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

const resetToken = ref(0)
const collapsedStates = shallowRef<boolean[]>([])
const answeredStates = shallowRef<boolean[]>([])

const syncStateWithQuestions = () => {
  const questionCount = questions.value.length

  collapsedStates.value = Array.from(
    { length: questionCount },
    (_, index) => collapsedStates.value[index] ?? false,
  )

  attempts.value = Array.from({ length: questionCount }, (_, index) => attempts.value[index] ?? [])

  answeredStates.value = Array.from({ length: questionCount }, (_, index) => {
    if (isAnswerSaved.value) return true
    return (attempts.value[index] ?? []).length > 0
  })
}

watch(
  () => questions.value,
  () => {
    syncStateWithQuestions()
  },
  { immediate: true },
)

watch(
  [() => questions.value.length, attempts],
  () => {
    if (isAnswerSaved.value) return
    answeredStates.value = questions.value.map(
      (_, index) => (attempts.value[index] ?? []).length > 0,
    )
  },
  { deep: true },
)

watch(
  isAnswerSaved,
  (saved) => {
    if (saved) {
      answeredStates.value = questions.value.map(() => true)
      return
    }

    answeredStates.value = questions.value.map(
      (_, index) => (attempts.value[index] ?? []).length > 0,
    )
  },
  { immediate: true },
)

const { settings } = storeToRefs(useUserSettingsStore())
const historyStore = useQuestionHistoryStore()
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
  const submittedMap = await submit({
    historyId: firstQuestion.history_id,
    type: firstQuestion.type,
    questionIds,
    answers: attempts.value,
  })

  answeredStates.value = questionIds.map((questionId) => submittedMap.get(questionId) === true)
  isAnswerSaved.value = answeredStates.value.every(Boolean)

  if (isAnswerSaved.value) {
    void historyStore.fetchHistories()
  }
}

const resetState = () => {
  attempts.value = questions.value.map(() => [])
  answeredStates.value = questions.value.map(() => false)
  isAnswerSaved.value = false
  resetToken.value += 1
  timeUsed.value = 0
}

const panel = ref<HTMLElement | null>(null)
const { y } = useScroll(panel, { behavior: 'smooth' })
const questionRef = useTemplateRef<ComponentPublicInstance[]>('questionRef')
const questionHeights = shallowRef<number[]>([])

const recalculateHeights = useDebounceFn(() => {
  // Measured heights let the navigator jump to exact question offsets.
  questionHeights.value =
    questionRef.value?.map((component) => (component.$el as HTMLElement).clientHeight) ?? []
}, 120)

watch([questionRef, collapsedStates, () => questions.value.length], () => {
  recalculateHeights()
})

watch(scrollToQuestionIndex, (index) => {
  if (index < 0) return

  y.value = questionHeights.value.slice(0, index).reduce((sum, height) => sum + height, 0)
})

const timeUsed = ref(0)
const elapsedTime = computed(() => {
  const minute = Math.floor(timeUsed.value / 60)
  const second = String(timeUsed.value % 60).padStart(2, '0')
  return `${minute}:${second}`
})

const timer = useIntervalFn(
  () => {
    timeUsed.value += 1
  },
  1000,
  { immediate: false },
)

watch(
  [isAnswerSaved, () => questions.value.length],
  ([saved, questionCount]) => {
    if (saved || questionCount === 0) {
      timer.pause()
      return
    }

    timer.resume()
  },
  { immediate: true },
)

onUnmounted(() => {
  timer.pause()
})
</script>
