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
