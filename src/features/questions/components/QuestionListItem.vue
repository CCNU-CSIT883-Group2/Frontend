<template>
  <Fieldset v-model:collapsed="isCollapsed" toggleable>
    <template #legend>
      <button
        type="button"
        class="w-full flex items-center px-2 py-1 cursor-pointer"
        @click.stop="toggleCardCollapsed"
      >
        <i :class="isCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" class="text-xs mr-2" />
        <span class="font-bold">Question {{ no }}</span>
        <div v-if="settings.questions.showDifficulty" class="font-bold ml-2 flex items-center">
          <span class="mr-2">-</span>
          <Rating :default-value="question.difficulty" readonly />
        </div>
      </button>
    </template>

    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="mx-2.5 mt-1 flex items-center justify-between text-left font-semibold text-surface-700 dark:text-surface-200"
        @click="isQuestionSectionCollapsed = !isQuestionSectionCollapsed"
      >
        <span>Question</span>
        <i
          :class="isQuestionSectionCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'"
          class="text-xs"
        />
      </button>

      <div v-show="!isQuestionSectionCollapsed">
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
      </div>

      <div v-if="isAnswered" class="flex flex-col gap-2">
        <button
          type="button"
          class="mx-2.5 mt-1 flex items-center justify-between text-left font-semibold text-surface-700 dark:text-surface-200"
          @click="isExplanationCollapsed = !isExplanationCollapsed"
        >
          <span>Explanation</span>
          <i :class="isExplanationCollapsed ? 'pi pi-chevron-right' : 'pi pi-chevron-down'" class="text-xs" />
        </button>

        <div v-show="!isExplanationCollapsed" class="mx-2.5">
          {{ question.explanation }}
        </div>
      </div>
    </div>
  </Fieldset>
</template>

<script setup lang="ts">
import { useUserSettingsStore } from '@/stores/userStore'
import type { Question } from '@/types'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

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

const isCollapsed = defineModel<boolean>('isCollapsed', { default: false })
const selectedAttemptIndices = defineModel<number[]>('attempt', { default: [] })
const resetToken = defineModel<number>('resetToken', { default: 0 })
const isQuestionSectionCollapsed = ref(false)
const isExplanationCollapsed = ref(false)

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

watch(resetToken, () => {
  selectedOption.value = null
  isQuestionSectionCollapsed.value = false
  isExplanationCollapsed.value = false
})

watch(
  () => props.isAnswered,
  (answered) => {
    if (!answered) {
      isExplanationCollapsed.value = false
    }
  },
)

const toggleCardCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}

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
