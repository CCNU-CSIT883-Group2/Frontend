<template>
  <div class="flex flex-1 min-h-0">
    <div class="flex flex-1 min-h-0 flex-col gap-2 xl:flex-row">
      <QuestionList
        v-model:attempts="attempts"
        v-model:is-answer-saved="isAnswerSaved"
        v-model:scroll-to="scrollToIndex"
        :questions="questions"
        class="flex-1 min-h-0 min-w-0"
      />

      <div class="w-full p-2 border rounded-2xl flex flex-col gap-2 border-color xl:flex-none xl:w-72">
        <div class="flex gap-2 flex-col">
          <span class="font-extrabold px-2 pt-1 xl:px-4">Questions:</span>

          <div
            class="grid grid-cols-6 gap-2 px-1 max-h-40 overflow-y-auto sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-4 xl:gap-4 xl:px-4 xl:max-h-none"
          >
            <Button
              v-for="(_, index) in questions"
              :key="index"
              :variant="attempts[index]?.length === 0 ? 'outlined' : undefined"
              class="w-full aspect-square max-w-[3rem] mx-auto"
              severity="secondary"
              @click="scrollToQuestion(index)"
            >
              <template #default>
                <div class="flex items-center">
                  <span class="text-center">{{ index + 1 }}</span>
                </div>
              </template>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionList from '@/features/questions/components/QuestionList.vue'
import { useAnswerPanelState } from '@/features/questions/composables/useAnswerPanelState'
import { nextTick, ref } from 'vue'

interface AnswerPanelProps {
  historyId: number
}

const props = defineProps<AnswerPanelProps>()

const { questions, attempts, isAnswerSaved } = useAnswerPanelState(props.historyId)

const scrollToIndex = ref(-1)
const scrollToQuestion = async (questionIndex: number) => {
  if (scrollToIndex.value === questionIndex) {
    scrollToIndex.value = -1
    await nextTick()
  }

  scrollToIndex.value = questionIndex
}
</script>
