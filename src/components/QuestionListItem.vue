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
        v-model="selected"
        :options="question.options"
        :multiple="question.type == 'multi'"
        class="flex-1 flex flex-col"
      >
        <template #option="{ option, index }">
          <div
            class="px"
            :class="{
              'text-green-600 font-extrabold': answeredAndCorrect && question.answer == index,
              'text-red-600 font-extrabold': answerAndIncorrect && selectedIndex == index,
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
    attempt?: number
  }>(),
  {
    answerSaved: false,
    attempt: -1,
  },
)
const emits = defineEmits(['update:attempt', 'update:collapsed'])

const isCollapsed = defineModel('isCollapsed', { type: Boolean, default: false })

// const collapsed = ref(false)
const handleClick = () => {
  // collapsed.value = !collapsed.value
  // emits('update:collapsed', collapsed.value)
  // console.log(collapsed.value)
  isCollapsed.value = !isCollapsed.value
  console.log(isCollapsed.value)
}

const selected = ref(null)
const selectedIndex = computed(() => props.question.options.findIndex((o) => o === selected.value))

watch(selected, (newVal) => {
  if (newVal !== null) {
    emits('update:attempt', selectedIndex.value)
  }
})

const correctAnswer = ref(props.question.options[props.question.answer])

const answeredAndCorrect = computed(
  () => selected.value !== null && props.answerSaved && correctAnswer.value === selected.value,
)

const answerAndIncorrect = computed(
  () => selected.value !== null && props.answerSaved && correctAnswer.value !== selected.value,
)

const { settings } = useUserSettingsStore()
</script>

<style scoped></style>
