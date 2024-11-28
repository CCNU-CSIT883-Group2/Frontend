<template>
  <div class="flex flex-col">
    <div class="flex justify-end mb-2">
      <split-button label="Save" :model="submitButtons" size="small" severity="secondary" />
    </div>
    <div class="overflow-y-scroll flex-1" ref="panel">
      <question-list-item
        v-for="(q, i) in props.questions"
        :key="q.id"
        :no="i + 1"
        :question="q"
        class="my-2 mx-3"
        ref="questionRef"
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
  reactive,
  ref,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue'
import { useDebounceFn, useScroll } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    questions?: Array<Question>
  }>(),
  {
    questions: () => [] as Array<Question>,
  },
)

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

const submitButtons = [
  {
    label: 'Submit',
    command: () => {},
  },
]
</script>

<style scoped></style>
