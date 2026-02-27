/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的自动保存与单题保存状态（模块：useQuestionAutoSave）。
 *
 * 设计原因（为什么）：
 * - 把防抖保存、状态同步、并发去重从组件中抽离，避免模板层逻辑膨胀。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import type { Question, QuestionSaveRequest, QuestionSaveState, Response } from '@/types'
import {
  computed,
  onUnmounted,
  shallowRef,
  type Ref,
  watch,
} from 'vue'

interface UseQuestionAutoSaveOptions {
  historyId: Ref<number | null>
  questions: Ref<Question[]>
  attempts: Ref<number[][]>
  isAnswerSaved: Ref<boolean>
  initialSavedQuestionIds: Ref<number[]>
  isHydrated: Ref<boolean>
  debounceMs?: number
}

interface QueuedSavePayload {
  questionId: number
  answers: number[]
  signature: string
  version: number
}

const normalizeAnswers = (answers: number[]) =>
  Array.from(new Set(answers.filter((value) => Number.isInteger(value)))).sort((a, b) => a - b)

const buildAnswerSignature = (answers: number[]) => normalizeAnswers(answers).join(',')

const clearTimer = (timer: ReturnType<typeof setTimeout> | undefined) => {
  if (timer !== undefined) {
    clearTimeout(timer)
  }
}

export const useQuestionAutoSave = ({
  historyId,
  questions,
  attempts,
  isAnswerSaved,
  initialSavedQuestionIds,
  isHydrated,
  debounceMs = 800,
}: UseQuestionAutoSaveOptions) => {
  /** 每道题最近一次保存状态（idle/saving/saved/error） */
  const questionSaveStateMap = shallowRef<Map<number, QuestionSaveState>>(new Map())
  /** 最近一次保存失败信息（无失败时为 null） */
  const error = shallowRef<string | null>(null)
  /** 当前飞行中的保存请求数量 */
  const pendingCount = shallowRef(0)

  const lastSavedSignatureMap = new Map<number, string>()
  const latestVersionMap = new Map<number, number>()
  const queuedPayloadMap = new Map<number, QueuedSavePayload>()
  const timerMap = new Map<number, ReturnType<typeof setTimeout>>()
  const inFlightPromiseMap = new Map<number, Promise<void>>()

  const setQuestionSaveState = (questionId: number, state: QuestionSaveState) => {
    const nextMap = new Map(questionSaveStateMap.value)
    nextMap.set(questionId, state)
    questionSaveStateMap.value = nextMap
  }

  const syncQuestionSaveStateMap = () => {
    const questionIds = new Set(questions.value.map((question) => question.question_id))
    const nextStateMap = new Map<number, QuestionSaveState>()

    questions.value.forEach((question) => {
      const state = questionSaveStateMap.value.get(question.question_id) ?? 'idle'
      nextStateMap.set(question.question_id, state)
    })

    questionSaveStateMap.value = nextStateMap

    for (const [questionId, timer] of timerMap.entries()) {
      if (questionIds.has(questionId)) continue
      clearTimer(timer)
      timerMap.delete(questionId)
      queuedPayloadMap.delete(questionId)
      inFlightPromiseMap.delete(questionId)
      lastSavedSignatureMap.delete(questionId)
      latestVersionMap.delete(questionId)
    }
  }

  const applyInitialSavedState = () => {
    if (!isHydrated.value) return

    const savedQuestionIds = new Set(initialSavedQuestionIds.value)
    const nextStateMap = new Map(questionSaveStateMap.value)

    questions.value.forEach((question, index) => {
      const questionId = question.question_id
      const answers = normalizeAnswers(attempts.value[index] ?? [])
      const signature = buildAnswerSignature(answers)
      const hasAnswer = answers.length > 0

      if (savedQuestionIds.has(questionId) && hasAnswer) {
        nextStateMap.set(questionId, 'saved')
        lastSavedSignatureMap.set(questionId, signature)
        return
      }

      if (nextStateMap.get(questionId) !== 'saving') {
        nextStateMap.set(questionId, 'idle')
      }
      lastSavedSignatureMap.delete(questionId)
    })

    questionSaveStateMap.value = nextStateMap
  }

  const buildSaveRequestBody = (questionId: number, answers: number[]): QuestionSaveRequest => ({
    history_id: historyId.value ?? 0,
    question_id: questionId,
    choice_answers: answers.length > 0 ? answers : null,
  })

  const executeQueuedSave = (questionId: number): Promise<void> => {
    const queuedPayload = queuedPayloadMap.get(questionId)
    if (!queuedPayload) {
      return Promise.resolve()
    }

    clearTimer(timerMap.get(questionId))
    timerMap.delete(questionId)
    queuedPayloadMap.delete(questionId)

    if (!historyId.value) {
      return Promise.resolve()
    }

    const requestPromise = (async () => {
      pendingCount.value += 1

      try {
        await axios.post<Response<undefined>>(
          '/questions/save',
          buildSaveRequestBody(queuedPayload.questionId, queuedPayload.answers),
        )

        // 仅当该请求仍是此题最新版本时才回写状态，避免旧请求覆盖新答案。
        if (latestVersionMap.get(questionId) === queuedPayload.version) {
          lastSavedSignatureMap.set(questionId, queuedPayload.signature)
          setQuestionSaveState(questionId, 'saved')
          error.value = null
        }
      } catch (requestError) {
        if (latestVersionMap.get(questionId) === queuedPayload.version) {
          setQuestionSaveState(questionId, 'error')
          error.value = requestError instanceof Error ? requestError.message : String(requestError)
        }
      } finally {
        pendingCount.value = Math.max(0, pendingCount.value - 1)
        inFlightPromiseMap.delete(questionId)
      }
    })()

    inFlightPromiseMap.set(questionId, requestPromise)
    return requestPromise
  }

  const queueSave = (questionId: number, answers: number[]) => {
    if (!historyId.value || isAnswerSaved.value) return

    const normalizedAnswers = normalizeAnswers(answers)
    const signature = buildAnswerSignature(normalizedAnswers)
    const currentSavedSignature = lastSavedSignatureMap.get(questionId) ?? ''
    const currentQueuedSignature = queuedPayloadMap.get(questionId)?.signature

    if (signature === currentSavedSignature || signature === currentQueuedSignature) {
      return
    }

    const nextVersion = (latestVersionMap.get(questionId) ?? 0) + 1
    latestVersionMap.set(questionId, nextVersion)
    queuedPayloadMap.set(questionId, {
      questionId,
      answers: normalizedAnswers,
      signature,
      version: nextVersion,
    })
    setQuestionSaveState(questionId, 'saving')

    clearTimer(timerMap.get(questionId))
    timerMap.set(
      questionId,
      setTimeout(() => {
        void executeQueuedSave(questionId)
      }, debounceMs),
    )
  }

  const flush = async () => {
    const queuedQuestionIds = Array.from(queuedPayloadMap.keys())
    await Promise.all(queuedQuestionIds.map((questionId) => executeQueuedSave(questionId)))
    await Promise.allSettled(Array.from(inFlightPromiseMap.values()))
  }

  const resetSaveStates = () => {
    for (const timer of timerMap.values()) {
      clearTimer(timer)
    }

    timerMap.clear()
    queuedPayloadMap.clear()
    inFlightPromiseMap.clear()
    lastSavedSignatureMap.clear()
    latestVersionMap.clear()
    error.value = null

    const nextStateMap = new Map<number, QuestionSaveState>()
    questions.value.forEach((question) => {
      nextStateMap.set(question.question_id, 'idle')
    })
    questionSaveStateMap.value = nextStateMap
  }

  watch(questions, syncQuestionSaveStateMap, { immediate: true })

  watch([isHydrated, initialSavedQuestionIds], applyInitialSavedState, { immediate: true })

  watch(
    attempts,
    (currentAttempts) => {
      if (!isHydrated.value || isAnswerSaved.value) return

      questions.value.forEach((question, index) => {
        queueSave(question.question_id, currentAttempts[index] ?? [])
      })
    },
    { deep: true },
  )

  onUnmounted(() => {
    for (const timer of timerMap.values()) {
      clearTimer(timer)
    }
  })

  const savedProgress = computed(() => {
    if (questions.value.length === 0) return 0

    const savedCount = questions.value.reduce((count, question, index) => {
      const hasAnswer = normalizeAnswers(attempts.value[index] ?? []).length > 0
      const isSaved = questionSaveStateMap.value.get(question.question_id) === 'saved'
      return count + (hasAnswer && isSaved ? 1 : 0)
    }, 0)

    return savedCount / questions.value.length
  })

  return {
    questionSaveStateMap,
    error,
    pendingCount,
    savedProgress,
    flush,
    resetSaveStates,
  }
}
