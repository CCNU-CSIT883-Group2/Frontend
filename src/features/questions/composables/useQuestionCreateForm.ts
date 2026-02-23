/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useQuestionCreateForm）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { useQuestionHistoryStore } from '@/stores/questionHistoryStore'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, reactive, watch } from 'vue'

/** 题目类型：单选题 / 多选题 */
type QuestionKind = 'single' | 'multi'

/** AI 题目生成表单的字段结构 */
interface QuestionCreationFormState {
  /** 学科（如 "数学"、"English"） */
  subject: string
  /** 标签/知识点（如 "微积分"） */
  tag: string
  /** 生成题目数量（null 表示未填写） */
  number: number | null
  /** 题目类型：单选或多选 */
  type: QuestionKind
}

/** 表单字段的错误信息结构（空字符串表示无误） */
interface QuestionCreationFormErrors {
  subject: string
  tag: string
  number: string
}

/**
 * 题目生成表单 composable。
 *
 * 职责：
 * 1. 管理表单字段状态（subject、tag、number、type）；
 * 2. 提供字段级实时清错（输入时自动清除对应错误）；
 * 3. 提交前统一校验，全部通过才调用 store 的 createQuestions；
 * 4. 监听 store 的 createError，通过 Toast 弹出错误通知。
 */
export const useQuestionCreateForm = () => {
  /** 题目类型选项，供 SelectButton 使用 */
  const questionTypes: Array<{ label: string; value: QuestionKind }> = [
    { label: 'Single Choice', value: 'single' },
    { label: 'Multiple Choice', value: 'multi' },
  ]

  /** 表单字段状态（默认 10 道单选题） */
  const formState = reactive<QuestionCreationFormState>({
    subject: '',
    tag: '',
    number: 10,
    type: 'single',
  })

  /** 表单字段的校验错误信息（初始均为空） */
  const formErrors = reactive<QuestionCreationFormErrors>({
    subject: '',
    tag: '',
    number: '',
  })

  const historyStore = useQuestionHistoryStore()
  // 从 store 获取创建进度、流式状态和错误信息（保持响应性）
  const { createProgress, isStreaming, createError } = storeToRefs(historyStore)
  const toast = useToast()

  /**
   * 将 number 字段转换为整数（InputNumber 在某些场景下可能返回 null）。
   * Number(null) = 0，所以 || 0 作为兜底确保为整数。
   */
  const questionCount = computed(() => Number(formState.number) || 0)

  /**
   * 监听 store 的 createError：
   * 有错误时弹出 Toast 通知（3.5 秒），展示给用户。
   */
  watch(createError, (message) => {
    if (!message) return

    toast.add({
      severity: 'error',
      summary: 'Create quiz failed',
      detail: message,
      life: 3500,
    })
  })

  // 字段值变化时自动清除对应错误（减少"已修正但仍显示错误"的困惑）
  watch(
    () => formState.subject,
    () => {
      if (!formErrors.subject) return
      formErrors.subject = ''
    },
  )

  watch(
    () => formState.tag,
    () => {
      if (!formErrors.tag) return
      formErrors.tag = ''
    },
  )

  watch(
    () => formState.number,
    () => {
      if (!formErrors.number) return
      formErrors.number = ''
    },
  )

  /**
   * 提交前校验：检查 subject、tag 非空，number > 0。
   * 返回 true 表示校验通过，false 表示有错误（errors 已被写入）。
   */
  const validateForm = () => {
    formErrors.subject = formState.subject.trim() ? '' : 'Subject is required.'
    formErrors.tag = formState.tag.trim() ? '' : 'Tag is required.'
    formErrors.number = questionCount.value > 0 ? '' : 'Question count must be greater than 0.'

    return !formErrors.subject && !formErrors.tag && !formErrors.number
  }

  /**
   * 表单提交处理（绑定在 form @submit.prevent 事件上）：
   * 1. 校验失败则直接返回；
   * 2. 通过后调用 store.createQuestions 触发 AI 生成流程（SSE 流）。
   */
  const onFormSubmit = async () => {
    if (!validateForm()) return

    await historyStore.createQuestions(
      formState.subject.trim(),
      formState.tag.trim(),
      questionCount.value,
      formState.type,
    )
  }

  return {
    questionTypes,
    formState,
    formErrors,
    createProgress,
    isStreaming,
    onFormSubmit,
  }
}
