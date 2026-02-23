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

type QuestionKind = 'single' | 'multi'

interface QuestionCreationFormState {
  subject: string
  tag: string
  number: number | null
  type: QuestionKind
}

interface QuestionCreationFormErrors {
  subject: string
  tag: string
  number: string
}

export const useQuestionCreateForm = () => {
  const questionTypes: Array<{ label: string; value: QuestionKind }> = [
    { label: 'Single Choice', value: 'single' },
    { label: 'Multiple Choice', value: 'multi' },
  ]

  const formState = reactive<QuestionCreationFormState>({
    subject: '',
    tag: '',
    number: 10,
    type: 'single',
  })

  const formErrors = reactive<QuestionCreationFormErrors>({
    subject: '',
    tag: '',
    number: '',
  })

  const historyStore = useQuestionHistoryStore()
  const { createProgress, isStreaming, createError } = storeToRefs(historyStore)
  const toast = useToast()

  const questionCount = computed(() => Number(formState.number) || 0)

  watch(createError, (message) => {
    if (!message) return

    toast.add({
      severity: 'error',
      summary: 'Create quiz failed',
      detail: message,
      life: 3500,
    })
  })

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

  const validateForm = () => {
    formErrors.subject = formState.subject.trim() ? '' : 'Subject is required.'
    formErrors.tag = formState.tag.trim() ? '' : 'Tag is required.'
    formErrors.number = questionCount.value > 0 ? '' : 'Question count must be greater than 0.'

    return !formErrors.subject && !formErrors.tag && !formErrors.number
  }

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
