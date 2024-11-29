<template>
  <div class="flex flex-col">
    <div class="flex justify-end mb-2 gap-2">
      <Button
        label="Submit"
        size="small"
        severity="secondary"
        @click="submit"
        :disabled="disableSubmit"
      />
      <Button icon="pi pi-refresh" size="small" severity="secondary" @click="resetState" />
    </div>
    <div class="overflow-y-auto flex-1 no-scrollbar" ref="panel">
      <question-list-item
        v-for="(q, i) in props.questions"
        :key="q.id"
        :no="i + 1"
        :question="q"
        class="my-2 mx-3"
        ref="questionRef"
        :answered="answered[i]"
        v-model:reset="reset"
        v-model:is-collapsed="collapsed[i]"
        v-model:attempt="attempts[i]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Question } from '@/types'
import QuestionListItem from '@/components/QuestionListItem.vue'
import {
  type ComponentPublicInstance,
  computed,
  reactive,
  ref,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue'
import { useDebounceFn, useScroll } from '@vueuse/core'
import { useSubmit } from '@/hooks/useSubmit'
import { useQuestionHistoryStore } from '@/stores/useQuestionHistoryStore'

const props = withDefaults(
  defineProps<{
    questions?: Array<Question>
  }>(),
  {
    questions: () => [] as Array<Question>,
  },
)

const answerSaved = defineModel<boolean>('answerSaved', { default: false })

const questionRef = useTemplateRef<ComponentPublicInstance[]>('questionRef' as never)
const questionsHeight = ref<number[]>([])
const collapsed = reactive(Array(props.questions.length).fill(false))
const recalculateHeight = useDebounceFn(() => {
  scrollTo.value = -1
  questionsHeight.value = questionRef?.value?.map((q) => q.$el.clientHeight) as number[]
}, 500)
watch([questionRef, collapsed], () => {
  recalculateHeight()
})

const scrollTo = defineModel('scrollTo', { type: Number, default: -1 })
const panel = ref<HTMLElement | null>(null)
const { y } = useScroll(panel, { behavior: 'smooth' })
watchEffect(() => {
  if (scrollTo.value !== -1) {
    y.value = questionsHeight.value.slice(0, scrollTo.value).reduce((acc, cur) => acc + cur, 0)
  }
})

const attempts = defineModel<number[][]>('attempts', {
  default: [] as Array<number[]>,
})

const answered = ref<boolean[]>([])
watch(answerSaved, () => {
  if (answerSaved.value) {
    answered.value = props.questions.map(() => true)
  }
})

const disableSubmit = computed(() => {
  return attempts.value.some((a) => a.length === 0) || answerSaved.value
})

const submit = () => {
  const historyStore = useQuestionHistoryStore()

  const history_id = props.questions[0].history_id
  const question_type = props.questions[0].type
  const question_ids = props.questions.map((q) => q.id)

  const { answered: a, isFetching } = useSubmit(
    history_id,
    question_type,
    question_ids,
    attempts.value,
  )
  const h = watch(isFetching, (remain) => {
    if (remain === 0) {
      for (let i = 0; i < question_ids.length; i++) {
        answered.value.push(a.get(question_ids[i]) as boolean)
      }
      historyStore.fetch()
      answerSaved.value = true
      h.stop()
    }
  })
}

const reset = ref(false)

const resetState = () => {
  attempts.value = Array(props.questions.length).fill([])
  answered.value = Array(props.questions.length).fill(false)
  answerSaved.value = false
  reset.value = true
}
</script>

<style scoped></style>
