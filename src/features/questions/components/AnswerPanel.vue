<template>
  <!-- 答题面板容器：flex 布局撑满剩余高度 -->
  <div class="flex flex-1 min-h-0">
    <div class="flex flex-1 min-h-0 flex-col gap-2 xl:flex-row">
      <!-- 题目列表区域（左/上）：通过 defineModel 双向绑定 attempts、isAnswerSaved、scrollTo -->
      <QuestionList
        v-model:attempts="attempts"
        v-model:is-answer-saved="isAnswerSaved"
        v-model:scroll-to="scrollToIndex"
        :initial-saved-question-ids="initialSavedQuestionIds"
        :is-hydrated="isHydrated"
        :questions="questions"
        class="flex-1 min-h-0 min-w-0"
        @reset-completed="handleResetCompleted"
      />

      <!-- 题目导航面板（右/下）：显示题号按钮，点击跳转并展开对应卡片 -->
      <div class="w-full p-2 border rounded-2xl flex flex-col gap-2 border-color xl:flex-none xl:w-72">
        <div class="flex gap-2 flex-col">
          <span class="font-extrabold px-2 pt-1 xl:px-4">Questions:</span>

          <!-- 题号按钮网格：有作答时实心，无作答时空心（outlined）；点击触发滚动定位 -->
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
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：AnswerPanel）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import QuestionList from '@/features/questions/components/QuestionList.vue'
import { useAnswerPanelState } from '@/features/questions/composables/useAnswerPanelState'
import { nextTick, ref } from 'vue'

interface AnswerPanelProps {
  /** 当前题集 ID，用于拉取题目和历史作答 */
  historyId: number
}

const props = defineProps<AnswerPanelProps>()

// 从 composable 获取题目列表、作答状态和保存状态
const {
  questions,
  attempts,
  isAnswerSaved,
  initialSavedQuestionIds,
  isHydrated,
  reloadAttempts,
} = useAnswerPanelState(props.historyId)

/** 向 QuestionList 传递的滚动目标索引（-1 表示不滚动） */
const scrollToIndex = ref(-1)

/**
 * 点击题号按钮时触发滚动定位：
 * 若 scrollToIndex 与目标索引相同（已定位过），需先重置为 -1 再设置，
 * 确保 watch 能检测到变化（相同值不触发 watch）。
 */
const scrollToQuestion = async (questionIndex: number) => {
  if (scrollToIndex.value === questionIndex) {
    scrollToIndex.value = -1
    await nextTick()
  }

  scrollToIndex.value = questionIndex
}

/** reset 成功后重拉当前题集作答，确保本地状态与后端一致 */
const handleResetCompleted = () => {
  void reloadAttempts()
}
</script>
