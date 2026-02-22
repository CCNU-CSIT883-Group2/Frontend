<template>
  <Fieldset v-model:collapsed="isCollapsed" toggleable>
    <template #legend>
      <div class="flex items-center px-2">
        <span class="font-bold py-1">Question {{ no }}</span>
        <div v-if="settings.questions.showDifficulty" class="font-bold ml-2 flex">
          <span class="mr-2">-</span>
          <Rating :default-value="question.difficulty" readonly />
        </div>
      </div>
    </template>

    <p class="mx-2.5 mb-2.5">{{ question.content }}</p>

    <div class="flex">
      <SelectButton
        v-model="selectedOption"
        :disabled="isAnswered"
        :multiple="question.type === 'multi'"
        :options="optionItems"
        class="flex-1 flex flex-col"
        option-label="label"
        option-value="index"
      >
        <template #option="slot">
          <div
            class="px"
            :class="{
              'text-green-600 font-extrabold': isCorrectOption(slot.option.index),
              'text-red-600 font-extrabold': isWrongOption(slot.option.index),
            }"
          >
            <span>{{ slot.option.label }}</span>
          </div>
        </template>
      </SelectButton>
    </div>

    <div v-if="isAnswered" class="mx-2.5 mt-2">
      <span class="font-bold">Explanation:</span>
      <div>{{ question.explanation }}</div>
    </div>
  </Fieldset>
</template>

<script setup lang="ts">
import { useUserSettingsStore } from '@/stores/userStore'
import type { Question } from '@/types'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

interface OptionItem {
  label: string
  index: number
}

const props = withDefaults(
  defineProps<{
    question: Question
    no: number
    isAnswered?: boolean
  }>(),
  {
    isAnswered: false,
  },
)

const resetToken = defineModel<number>('resetToken', { default: 0 })
watch(resetToken, () => {
  selectedOption.value = null
})

const isCollapsed = defineModel<boolean>('isCollapsed', { default: false })
const selectedAttemptIndices = defineModel<number[]>('attempt', { default: [] })

const optionItems = computed<OptionItem[]>(() =>
  props.question.options.map((label, index) => ({
    label,
    index,
  })),
)

const selectedOption = computed<number | number[] | null>({
  get: () => {
    if (selectedAttemptIndices.value.length === 0) return null

    if (props.question.type === 'single') {
      return selectedAttemptIndices.value[0] ?? null
    }

    return selectedAttemptIndices.value
  },
  set: (value) => {
    if (value === null || value === undefined) {
      selectedAttemptIndices.value = []
      return
    }

    if (props.question.type === 'single') {
      selectedAttemptIndices.value = typeof value === 'number' ? [value] : []
      return
    }

    if (Array.isArray(value)) {
      selectedAttemptIndices.value = value.filter(
        (item): item is number => typeof item === 'number',
      )
      return
    }

    selectedAttemptIndices.value = typeof value === 'number' ? [value] : []
  },
})

const isCorrectOption = (index: number) => {
  return (
    selectedAttemptIndices.value.length !== 0 &&
    props.isAnswered &&
    props.question.correct_answers.includes(index) &&
    selectedAttemptIndices.value.includes(index)
  )
}

const isWrongOption = (index: number) => {
  return (
    selectedAttemptIndices.value.length !== 0 &&
    props.isAnswered &&
    !props.question.correct_answers.includes(index) &&
    selectedAttemptIndices.value.includes(index)
  )
}

const { settings } = storeToRefs(useUserSettingsStore())
</script>
