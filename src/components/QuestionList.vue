<template>
  <div class="flex flex-col">
    <div class="flex justify-between mb-2 gap-2 items-center">
      <div class="flex gap-2">
        <span v-show="settings.questions.showTime" class="font-bold">Time Used:</span>
        <span v-show="settings.questions.showTime" class="font-mono">
          {{ Math.floor(timeUsed / 60) }}:{{ String(timeUsed % 60).padStart(2, '0') }}
        </span>
      </div>

      <div class="flex gap-4">
        <Button label="Submit" size="small" severity="primary" @click="submit" :disabled="disableSubmit" />
        <Button icon="pi pi-refresh" size="small" severity="secondary" @click="resetState" />
      </div>
    </div>

    <div ref="panel" class="overflow-y-auto flex-1 no-scrollbar">
      <question-list-item
        v-for="(question, index) in props.questions"
        :key="question.question_id"
        ref="questionRef"
        :no="index + 1"
        :question="question"
        :answered="answered[index]"
        class="my-2 mx-3"
        v-model:reset="reset"
        v-model:is-collapsed="collapsed[index]"
        v-model:attempt="attempts[index]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionListItem from '@/components/QuestionListItem.vue'
import { useSubmit } from '@/hooks/useSubmit'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'
import { useUserSettingsStore } from '@/stores/user'
import type { Question } from '@/types'
import { useDebounceFn, useIntervalFn, useScroll } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted, ref, type ComponentPublicInstance, useTemplateRef, watch, watchEffect } from 'vue'

const props = withDefaults(
  defineProps<{
    questions?: Question[]
  }>(),
  {
    questions: () => [] as Question[],
  },
)

const answerSaved = defineModel<boolean>('answerSaved', { default: false })
const scrollTo = defineModel<number>('scrollTo', { default: -1 })
const attempts = defineModel<number[][]>('attempts', { default: [] })

const reset = ref(false)
const collapsed = ref<boolean[]>([])
const answered = ref<boolean[]>([])

const syncStateWithQuestions = () => {
  const questionCount = props.questions.length

  collapsed.value = Array.from({ length: questionCount }, (_, index) => collapsed.value[index] ?? false)

  if (attempts.value.length !== questionCount) {
    attempts.value = Array.from({ length: questionCount }, (_, index) => attempts.value[index] ?? [])
  }

  answered.value = Array.from({ length: questionCount }, (_, index) => {
    if (answerSaved.value) return true
    return (attempts.value[index] ?? []).length > 0
  })
}

watch(
  () => props.questions.length,
  () => {
    syncStateWithQuestions()
  },
  { immediate: true },
)

watch(
  answerSaved,
  (saved) => {
    if (saved) {
      answered.value = props.questions.map(() => true)
      timer.pause()
      return
    }

    answered.value = props.questions.map((_, index) => (attempts.value[index] ?? []).length > 0)
    timer.resume()
  },
  { immediate: true },
)

const disableSubmit = computed(() => {
  if (answerSaved.value) return true
  if (props.questions.length === 0) return true
  return attempts.value.some((attempt) => attempt.length === 0)
})

const { settings } = storeToRefs(useUserSettingsStore())
const historyStore = useQuestionHistoryStore()

const submit = () => {
  if (disableSubmit.value) return

  const firstQuestion = props.questions[0]
  const questionIds = props.questions.map((question) => question.question_id)

  const { answered: answeredMap, isFetching } = useSubmit(
    firstQuestion.history_id,
    firstQuestion.type,
    questionIds,
    attempts.value,
  )

  const stop = watch(
    isFetching,
    (remaining) => {
      if (remaining !== 0) return

      answered.value = questionIds.map((questionId) => answeredMap.get(questionId) === true)
      answerSaved.value = true
      void historyStore.fetch()
      stop()
    },
    { immediate: true },
  )
}

const resetState = () => {
  attempts.value = props.questions.map(() => [])
  answered.value = props.questions.map(() => false)
  answerSaved.value = false
  reset.value = true
  timeUsed.value = 0
}

const panel = ref<HTMLElement | null>(null)
const { y } = useScroll(panel, { behavior: 'smooth' })
const questionRef = useTemplateRef<ComponentPublicInstance[]>('questionRef' as never)
const questionHeights = ref<number[]>([])

const recalculateHeights = useDebounceFn(() => {
  scrollTo.value = -1
  questionHeights.value = questionRef.value?.map((component) => component.$el.clientHeight) ?? []
}, 150)

watch([questionRef, collapsed, () => props.questions.length], () => {
  recalculateHeights()
})

watchEffect(() => {
  if (scrollTo.value < 0) return
  y.value = questionHeights.value.slice(0, scrollTo.value).reduce((acc, current) => acc + current, 0)
})

const timeUsed = ref(0)
const timer = useIntervalFn(() => {
  timeUsed.value += 1
}, 1000)

onUnmounted(() => {
  timer.pause()
})
</script>

<style scoped></style>
