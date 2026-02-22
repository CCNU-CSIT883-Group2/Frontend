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
        :disabled="answered"
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
    <div class="mx-2.5 mt-2" v-if="answered">
      <span class="font-bold">Explanation:</span>
      <div>{{ question.explanation }}</div>
    </div>
  </Fieldset>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Question } from '@/types'
import { useUserSettingsStore } from '@/stores/user'

const props = withDefaults(
  defineProps<{
    question: Question
    no: number
    answered?: boolean
  }>(),
  {
    answered: false,
  },
)

const reset = defineModel<boolean>('reset', { default: false })
watch(reset, () => {
  if (reset.value) {
    s.value = null
    reset.value = false
  }
})
const isCollapsed = defineModel<boolean>('isCollapsed', { default: false })

const handleClick = () => {
  isCollapsed.value = !isCollapsed.value
}

const s = ref<string | string[] | null>(null)
watch(s, () => {
  if (s.value === null) {
    selected.value = []
    return
  }

  if (props.question.type === 'single') {
    selected.value = [props.question.options.indexOf(s.value as string)]
  } else if (props.question.type === 'multi') {
    selected.value = (s.value as string[]).map((v) => props.question.options.indexOf(v))
  }
})

const selected = defineModel<number[]>('attempt', { default: [] })

const isCorrectOption = (index: number) => {
  return (
    selected.value.length !== 0 &&
    props.answered &&
    props.question.correct_answers.includes(index) &&
    selected.value.includes(index)
  )
}

const isWrongOption = (index: number) =>
  selected.value.length !== 0 &&
  props.answered &&
  !props.question.correct_answers.includes(index) &&
  selected.value.includes(index)

const { settings } = useUserSettingsStore()
</script>

<style scoped></style>
