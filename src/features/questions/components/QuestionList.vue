<template>
  <!-- 题目列表容器：flex 布局，顶部工具栏 + 下方可滚动列表区域 -->
  <div class="flex min-h-0 flex-col">
    <!-- 工具栏：左侧计时器 + 右侧操作按钮 -->
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div class="flex w-full items-center gap-2 sm:w-auto">
        <!-- 计时器（受"显示时间"用户设置控制） -->
        <span v-show="settings.questions.showTime" class="font-bold">Time Used:</span>
        <span v-show="settings.questions.showTime" class="font-mono">{{ elapsedTime }}</span>
      </div>

      <div class="flex w-full justify-end gap-2 sm:w-auto sm:gap-4">
        <!-- 提交按钮：所有题目作答完毕且未保存时才可点击 -->
        <Button :disabled="disableSubmit" label="Submit" severity="primary" size="small" @click="submitAnswers" />
        <!-- 刷新按钮：清空所有作答并重置计时器 -->
        <Button icon="pi pi-refresh" severity="secondary" size="small" @click="resetState" />
      </div>
    </div>

    <!-- 题目卡片列表：overflow-y-auto 实现独立滚动，no-scrollbar 隐藏滚动条 -->
    <div class="overflow-y-auto flex-1 no-scrollbar">
      <!-- TransitionGroup 为卡片进入/离开添加动画（appear 支持初始挂载动画） -->
      <TransitionGroup name="question-card" tag="div" appear class="relative">
        <QuestionListItem
          v-for="(question, index) in questions"
          :key="question.question_id"
          ref="questionRef"
          v-model:attempt="attempts[index]"
          v-model:is-collapsed="collapsedStates[index]"
          v-model:reset-token="resetToken"
          :is-answered="answeredStates[index]"
          :no="index + 1"
          :question="question"
          :style="{ '--question-enter-delay': `${Math.min(index, 6) * 24}ms` }"
          class="my-2 mx-3"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件说明（是什么）：
 * - 本文件是「功能组件」。
 * - 实现 questions 领域的界面展示与交互行为（组件：QuestionList）。
 *
 * 设计原因（为什么）：
 * - 将业务界面拆成职责清晰的组件单元，减少重复代码并提升复用性。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import QuestionListItem from '@/features/questions/components/QuestionListItem.vue'
import { useQuestionElapsedTimer } from '@/features/questions/composables/useQuestionElapsedTimer'
import { useQuestionListState } from '@/features/questions/composables/useQuestionListState'
import { useSubmit } from '@/features/questions/composables/useSubmit'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { useUserSettingsStore } from '@/stores/userStore'
import type { Question } from '@/types'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import {
  computed,
  nextTick,
  type ComponentPublicInstance,
  useTemplateRef,
  watch,
} from 'vue'

interface QuestionListProps {
  /** 题目列表（可选，默认为空数组） */
  questions?: Question[]
}

const props = withDefaults(defineProps<QuestionListProps>(), {
  questions: () => [] as Question[],
})

// 包装为 computed，使 composable 中的 watch 能正确追踪 props 变化
const questions = computed(() => props.questions)

// defineModel 双向绑定父组件传入的状态
const isAnswerSaved = defineModel<boolean>('isAnswerSaved', { default: false })
/** 外部触发的滚动目标索引（-1 表示不滚动） */
const scrollToQuestionIndex = defineModel<number>('scrollTo', { default: -1 })
/** 每道题的用户作答数组 */
const attempts = defineModel<number[][]>('attempts', { default: () => [] as number[][] })

/** 题目卡片组件实例列表，用于获取 DOM 元素并触发滚动 */
const questionRef = useTemplateRef<ComponentPublicInstance[]>('questionRef')

// 从 composable 获取折叠状态、已答状态和重置方法
const { resetToken, collapsedStates, answeredStates, resetState: resetQuestionState } =
  useQuestionListState({
    questions,
    attempts,
    isAnswerSaved,
  })

// 计时器（题目加载后自动开始，已保存或题目为空时暂停）
const { elapsedTime, resetElapsedTime } = useQuestionElapsedTimer({
  isAnswerSaved,
  questionCount: computed(() => questions.value.length),
})

const { settings } = storeToRefs(useUserSettingsStore())
const historyStore = useQuestionHistoryStore()
const toast = useToast()
const { submit, isSubmitting } = useSubmit()

/**
 * 提交按钮禁用条件：
 * 1. 已保存（避免重复提交）；
 * 2. 题目为空；
 * 3. 正在提交中；
 * 4. 有任意题目未作答（attempts 中有空数组）。
 */
const disableSubmit = computed(() => {
  if (isAnswerSaved.value) return true
  if (questions.value.length === 0) return true
  if (isSubmitting.value) return true
  return attempts.value.some((attempt) => attempt.length === 0)
})

/**
 * 提交所有题目的作答：
 * 1. 从第一道题获取 history_id 和 type；
 * 2. 并发提交（允许部分失败）；
 * 3. 根据后端返回结果更新 answeredStates 和 isAnswerSaved；
 * 4. 有失败时展示警告或错误通知；
 * 5. 全部成功时更新本地 store 的进度并刷新历史列表。
 */
const submitAnswers = async () => {
  if (disableSubmit.value) return

  const firstQuestion = questions.value[0]
  if (!firstQuestion) return

  const questionIds = questions.value.map((question) => question.question_id)
  const submitResult = await submit({
    historyId: firstQuestion.history_id,
    type: firstQuestion.type,
    questionIds,
    answers: attempts.value,
  })

  // 按 question_id 更新每道题的已答状态
  answeredStates.value = questionIds.map(
    (questionId) => submitResult.answeredMap.get(questionId) === true,
  )
  isAnswerSaved.value = answeredStates.value.every(Boolean)

  // 部分或全部失败时展示通知
  if (submitResult.failureCount > 0) {
    const hasAnySuccess = submitResult.successCount > 0
    const summary = hasAnySuccess ? 'Partial submission' : 'Submit failed'
    const detail = hasAnySuccess
      ? `${submitResult.successCount}/${questionIds.length} answers were saved. ${submitResult.firstError ?? ''}`.trim()
      : (submitResult.firstError ?? 'Unable to submit answers. Please try again.')

    toast.add({
      severity: hasAnySuccess ? 'warn' : 'error',
      summary,
      detail,
      life: 3500,
    })
  }

  // 全部成功时将进度更新为 1 并刷新历史列表（确保侧边栏显示最新进度）
  if (isAnswerSaved.value) {
    historyStore.updateHistoryProgress(firstQuestion.history_id, 1)
    void historyStore.fetchHistories()
  }
}

/** 重置作答状态和计时器（点击刷新按钮时调用） */
const resetState = () => {
  resetQuestionState()
  resetElapsedTime()
}

/**
 * 滚动到指定题目卡片：
 * 1. 先展开目标卡片（collapsedStates 设为 false）；
 * 2. 等待 DOM 更新后获取组件的 $el 并调用 scrollIntoView。
 */
const scrollToQuestion = async (index: number) => {
  if (index < 0 || index >= questions.value.length) return

  // 展开目标卡片，保持其他卡片状态不变
  collapsedStates.value = collapsedStates.value.map(
    (collapsed, currentIndex) => (currentIndex === index ? false : collapsed),
  )
  await nextTick()

  const target = questionRef.value?.[index]
  const targetElement = target?.$el as HTMLElement | undefined
  targetElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * 监听外部传入的滚动目标索引：
 * 有效索引（>= 0）时执行滚动，之后立即重置为 -1，
 * 保证相同题号可以被多次触发。
 */
watch(scrollToQuestionIndex, (index) => {
  if (index < 0) return

  void scrollToQuestion(index)
  scrollToQuestionIndex.value = -1
})
</script>

<style scoped>
/* 题目卡片进入动画：淡入 + 从右侧滑入，带错开延迟（最多 6 张卡片错开） */
.question-card-enter-active {
  transition:
    opacity 180ms ease,
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--question-enter-delay, 0ms);
}

/* 题目卡片离开动画：绝对定位防止影响其他卡片布局 */
.question-card-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
}

/* 进入初始状态和离开终态：半透明 + 右偏移 32px */
.question-card-enter-from,
.question-card-leave-to {
  opacity: 0.5;
  transform: translateX(32px);
}

/* 列表重排时的移动动画 */
.question-card-move {
  transition: transform 220ms ease;
}

/* 用户偏好减弱动效：完全禁用过渡 */
@media (prefers-reduced-motion: reduce) {

  .question-card-enter-active,
  .question-card-leave-active,
  .question-card-move {
    transition: none;
  }
}
</style>
