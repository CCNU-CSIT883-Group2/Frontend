<template>
  <div class="flex justify-between gap-2">
    <question-list :questions="questions" class="flex-1" :scroll-to="scrollToIndex" />
    <div class="flex-none w-72 p-2 border rounded-2xl flex flex-col gap-2 border-color">
      <span class="font-extrabold px-4 pt-1">Questions: </span>
      <div class="gap-4 grid grid-cols-4 px-4">
        <Button
          variant="outlined"
          v-for="(_, i) in questions"
          severity="Secondary"
          :key="i"
          class="w-12 h-12"
          @click="scrollTo(i)"
        >
          <template #default>
            <div class="flex items-center">
              <span class="text-center">{{ i + 1 }}</span>
            </div>
          </template>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionList from '@/components/QuestionList.vue'
import { ref } from 'vue'
import type { Question } from '@/types'

const questions = ref<Question[]>([
  {
    id: 1,
    content: 'What is the capital of France?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    explanation: 'Paris is the capital of France.',
    time_required: 60,
    answer: 0,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 2,
    content: 'What is the capital of Germany?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    explanation: 'Berlin is the capital of Germany.',
    time_required: 60,
    answer: 2,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 3,
    content: 'What is the capital of Spain?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    explanation: 'Madrid is the capital of Spain.',
    time_required: 60,
    answer: 3,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 4,
    content: 'What is the capital of the United Kingdom?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    explanation: 'London is the capital of the United Kingdom.',
    time_required: 60,
    answer: 1,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 5,
    content: 'What is the capital of Italy?',
    options: ['Paris', 'London', 'Rome', 'Madrid'],
    explanation: 'Rome is the capital of Italy.',
    time_required: 60,
    answer: 2,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 6,
    content: 'What is the capital of the United States?',
    options: ['Washington D.C.', 'New York', 'Los Angeles', 'Chicago'],
    explanation: 'Washington D.C. is the capital of the United States.',
    time_required: 60,
    answer: 0,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 7,
    content: 'What is the capital of Canada?',
    options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
    explanation: 'Ottawa is the capital of Canada.',
    time_required: 60,
    answer: 3,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 8,
    content: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
    explanation: 'Canberra is the capital of Australia.',
    time_required: 60,
    answer: 2,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 9,
    content: 'What is the capital of Japan?',
    options: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'],
    explanation: 'Tokyo is the capital of Japan.',
    time_required: 60,
    answer: 0,
    difficulty: 2,
    type: 'single',
  },
  {
    id: 10,
    content: 'What is the capital of China?',
    options: ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen'],
    explanation: 'Beijing is the capital of China.',
    time_required: 60,
    answer: 1,
    difficulty: 2,
    type: 'single',
  },
])

const scrollToIndex = ref(-1)
const scrollTo = (index: number) => {
  scrollToIndex.value = index
}
</script>
