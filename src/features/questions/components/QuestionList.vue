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
        <Button :disabled="isResetting" icon="pi pi-refresh" severity="secondary" size="small" @click="requestReset" />
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
          :save-state="questionSaveStateMap.get(question.question_id) ?? 'idle'"
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
import { useQuestionAutoSave } from '@/features/questions/composables/useQuestionAutoSave'
import { useQuestionElapsedTimer } from '@/features/questions/composables/useQuestionElapsedTimer'
import { useQuestionListState } from '@/features/questions/composables/useQuestionListState'
import { useSubmit } from '@/features/questions/composables/useSubmit'
import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { useUserSettingsStore } from '@/stores/userStore'
import type { AttemptAnswerInput, Question } from '@/types'
import { storeToRefs } from 'pinia'
import { useConfirm, useToast } from 'primevue'
import {
  computed,
  nextTick,
  ref,
  type ComponentPublicInstance,
  useTemplateRef,
  watch,
} from 'vue'

interface QuestionListProps {
  /** 题目列表（可选，默认为空数组） */
  questions?: Question[]
  /** 题集首次加载时，已保存过答案的题目 ID 列表 */
  initialSavedQuestionIds?: number[]
  /** 当前题集是否已完成 questions/attempts 首次对齐 */
  isHydrated?: boolean
}

const props = withDefaults(defineProps<QuestionListProps>(), {
  questions: () => [] as Question[],
  initialSavedQuestionIds: () => [] as number[],
  isHydrated: false,
})

const emit = defineEmits<{
  (e: 'reset-completed'): void
}>()

// 包装为 computed，使 composable 中的 watch 能正确追踪 props 变化
const questions = computed(() => props.questions)
const initialSavedQuestionIds = computed(() => props.initialSavedQuestionIds)
const isHydrated = computed(() => props.isHydrated)

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
const confirm = useConfirm()
const { submit, isSubmitting } = useSubmit()
const isResetting = ref(false)
const currentHistoryId = computed<number | null>(() => questions.value[0]?.history_id ?? null)

/**
 * 自动保存引擎：
 * - 管理每题保存状态（供卡片右侧显示绿色 Saved 标识）；
 * - 计算“已保存进度”驱动侧边栏 progress；
 * - 暴露 flush/resetSaveStates，供 submit/reset 前后控制持久化一致性。
 */
const {
  questionSaveStateMap,
  error: autoSaveError,
  savedProgress,
  flush,
  resetSaveStates,
} = useQuestionAutoSave({
  historyId: currentHistoryId,
  questions,
  attempts,
  isAnswerSaved,
  initialSavedQuestionIds,
  isHydrated,
})

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
  if (isResetting.value) return true
  if (isSubmitting.value) return true
  return attempts.value.some((attempt) => attempt.length === 0)
})

const toAttemptAnswerInput = (questionId: number, selectedAnswers: number[]): AttemptAnswerInput => {
  // 提交前再次规范化答案：去重 + 升序，保证与自动保存口径一致。
  const normalizedAnswers = Array.from(new Set(selectedAnswers)).sort((left, right) => left - right)
  return {
    question_id: questionId,
    choice_answers: normalizedAnswers.length > 0 ? normalizedAnswers : null,
  }
}

/**
 * 提交所有题目的作答：
 * 1. 先 flush 自动保存队列，确保后端拿到最新答案；
 * 2. 调用新版 /attempt 批量提交；
 * 3. 成功后锁定题目并展示 summary；
 * 4. 更新本地进度为 100%，并刷新历史列表。
 */
const submitAnswers = async () => {
  if (disableSubmit.value) return

  const firstQuestion = questions.value[0]
  if (!firstQuestion) return

  // 先把防抖队列中的“最后一次编辑”落盘，避免提交的答案比 UI 落后。
  await flush()

  const answers = questions.value.map((question, index) =>
    toAttemptAnswerInput(question.question_id, attempts.value[index] ?? []),
  )
  const submitResult = await submit({
    historyId: firstQuestion.history_id,
    answers,
  })

  if (!submitResult.success) {
    toast.add({
      severity: 'error',
      summary: 'Submit failed',
      detail: submitResult.firstError ?? 'Unable to submit answers. Please try again.',
      life: 3500,
    })
    return
  }

  isAnswerSaved.value = true
  answeredStates.value = questions.value.map(() => true)

  const summary = submitResult.summary
  const detail = summary
    ? `Correct ${summary.correct_questions}/${summary.total_questions} (${(summary.correct_rate * 100).toFixed(1)}%)`
    : 'All answers submitted.'

  toast.add({
    severity: 'success',
    summary: 'Submitted',
    detail,
    life: 3500,
  })

  historyStore.updateHistoryProgress(firstQuestion.history_id, 1)
  void historyStore.fetchHistories()
}

/** 重置作答状态和计时器（点击刷新按钮时调用） */
const resetState = () => {
  resetQuestionState()
  resetElapsedTime()
  // 清空自动保存内部状态，确保重置后每题从 idle 重新开始。
  resetSaveStates()
}

/**
 * 执行重置：
 * 1. 先 flush 自动保存，避免旧请求回写；
 * 2. 调用 /history/reset；
 * 3. 成功后重置本地状态并刷新 history 列表。
 */
const performReset = async () => {
  const historyId = currentHistoryId.value
  if (!historyId || isResetting.value) return

  isResetting.value = true
  // 重置前强制落盘，避免重置后旧请求再回写造成状态闪烁。
  await flush()

  const resetError = await historyStore.resetHistory(historyId)
  if (resetError) {
    toast.add({
      severity: 'error',
      summary: 'Reset failed',
      detail: resetError,
      life: 3500,
    })
    isResetting.value = false
    return
  }

  resetState()
  // 先本地置零，确保侧边栏即时反馈；随后 fetchHistories 做后端对齐。
  historyStore.updateHistoryProgress(historyId, 0)
  void historyStore.fetchHistories()
  emit('reset-completed')

  toast.add({
    severity: 'success',
    summary: 'Reset completed',
    detail: 'All answers have been reset.',
    life: 2500,
  })
  isResetting.value = false
}

/** 弹出确认框，请用户确认是否重置当前题集 */
const requestReset = () => {
  if (!currentHistoryId.value || isResetting.value) return

  confirm.require({
    message: 'Reset all answers for this history?',
    header: 'Reset Answers',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Reset',
      severity: 'danger',
    },
    accept: () => {
      void performReset()
    },
  })
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

/**
 * 单题自动保存失败时提示一次错误。
 * 题目卡片只在保存成功时显示绿色标识，失败通过 toast 感知。
 */
watch(autoSaveError, (nextError) => {
  if (!nextError) return

  toast.add({
    severity: 'error',
    summary: 'Auto-save failed',
    detail: nextError,
    life: 3000,
  })
})

/** 自动保存成功进度实时同步到侧边栏进度条（提交后不再覆盖 100%）。 */
watch(
  savedProgress,
  (progress) => {
    // 题集已提交后 progress 固定为 100%，不再被自动保存进度覆盖。
    if (isAnswerSaved.value) return

    const historyId = currentHistoryId.value
    if (!historyId) return
    // 自动保存每成功一题，立即同步到侧边栏进度圆环。
    historyStore.updateHistoryProgress(historyId, progress)
  },
  { immediate: true },
)
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
