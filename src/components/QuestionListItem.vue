<template>
  <Fieldset :collapsed="isCollapsed" toggleable>
    <template #legend>
      <div class="flex items-center px-2 cursor-pointer" @click="handleClick">
        <span class="font-bold py-1">Question {{ props.no }}</span>
        <div v-if="settings.questions.showDifficulty" class="font-bold ml-2 flex">
          <span class="mr-2">-</span>
          <rating :default-value="question.difficulty" readonly />
        </div>
      </div>
    </template>
    <p class="mx-2.5 mb-2.5">{{ question.content }}</p>
    <div class="flex">
      <select-button
        v-model="s"
        :options="question.options"
        :multiple="question.type == 'multi'"
        class="flex-1 flex flex-col"
      >
        <template #option="{ option, index }">
          <div
            class="px"
            :class="{
              'text-green-600 font-extrabold': isCorrectOption(index),
              'text-red-600 font-extrabold': isWrongOption(index),
            }"
          >
            <span>{{ option }}</span>
          </div>
        </template>
      </select-button>
    </div>
  </Fieldset>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Question } from '@/types'
import { useUserSettingsStore } from '@/stores/user'

const props = withDefaults(
  defineProps<{
    question: Question
    no: number
    answerSaved?: boolean
  }>(),
  {
    answerSaved: false,
  },
)

const isCollapsed = defineModel<boolean>('isCollapsed', { default: false })

// const collapsed = ref(false)
const handleClick = () => {
  isCollapsed.value = !isCollapsed.value
}

const s = ref<string | string[] | null>(null)
watch(s, () => {
  if (props.question.type === 'single') {
    selected.value = s.value !== null ? [s.value as string] : []
  } else if (props.question.type === 'multi') {
    selected.value = s.value as string[]
  }
})
const selected = ref<string[]>([])
const selectedIndex = computed(() => selected.value.map((s) => props.question.options.indexOf(s)))
const attempt = defineModel<number[]>('attempt', { default: [] })
watch(selected, () => {
  attempt.value = selectedIndex.value
})

const correctAnswer = ref(props.question.answer.map((a) => props.question.options[a]))

const isCorrectOption = (index: number) =>
  selected.value.length !== 0 &&
  props.answerSaved &&
  correctAnswer.value === selected.value &&
  props.question.answer.includes(index)

const isWrongOption = (index: number) =>
  selected.value.length !== 0 &&
  props.answerSaved &&
  correctAnswer.value !== selected.value &&
  selectedIndex.value.includes(index)

const { settings } = useUserSettingsStore()
</script>

<style scoped></style>
