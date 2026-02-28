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
  /** 单题版本号：用于拒绝“旧请求晚到后覆盖新状态”的回写 */
  version: number
}

/**
 * 统一答案格式（去重、过滤非法值、升序）：
 * 1. 避免同一答案集合因顺序不同被误判为“有变化”；
 * 2. 让签名与请求体保持稳定，便于前后状态比较。
 */
const normalizeAnswers = (answers: number[]) =>
  Array.from(new Set(answers.filter((value) => Number.isInteger(value)))).sort((a, b) => a - b)

/** 基于规范化后的答案生成签名，用于快速判断“答案是否真的变化”。 */
const buildAnswerSignature = (answers: number[]) => normalizeAnswers(answers).join(',')

/** 清理单题防抖计时器（timer 为空时安全 no-op）。 */
const clearTimer = (timer: ReturnType<typeof setTimeout> | undefined) => {
  if (timer !== undefined) {
    clearTimeout(timer)
  }
}

/**
 * 自动保存 composable：
 * - 提供单题防抖保存、状态跟踪和 flush 落盘能力；
 * - 对每题维护版本号，避免旧请求晚到覆盖新编辑。
 */
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

  /**
   * 关键内部状态容器（非响应式）：
   * - lastSavedSignatureMap：记录每题“已成功持久化”的最新答案签名；
   * - latestVersionMap：记录每题最新本地编辑版本；
   * - queuedPayloadMap：记录每题下一次待发送请求；
   * - timerMap：记录每题防抖计时器；
   * - inFlightPromiseMap：记录每题当前飞行中的请求 Promise（flush 会等待它们）。
   */
  const lastSavedSignatureMap = new Map<number, string>()
  const latestVersionMap = new Map<number, number>()
  const queuedPayloadMap = new Map<number, QueuedSavePayload>()
  const timerMap = new Map<number, ReturnType<typeof setTimeout>>()
  const inFlightPromiseMap = new Map<number, Promise<void>>()

  /** 统一更新响应式 Map，确保视图层能感知状态变化。 */
  const setQuestionSaveState = (questionId: number, state: QuestionSaveState) => {
    const nextMap = new Map(questionSaveStateMap.value)
    nextMap.set(questionId, state)
    questionSaveStateMap.value = nextMap
  }

  /**
   * 与当前题目列表同步内部状态：
   * - 保留仍存在题目的状态；
   * - 清理已不存在题目的计时器、队列和版本信息，避免切题集后状态泄漏。
   */
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

  /**
   * 应用“初始已保存题目”：
   * - 页面首次加载时，如果后端已存在答案，直接标记为 saved；
   * - 同步写入 lastSavedSignature，避免 watcher 立刻重复触发保存请求。
   */
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

  /** 构造 /questions/save 请求体：空答案显式发送 null，表示清空并保存。 */
  const buildSaveRequestBody = (questionId: number, answers: number[]): QuestionSaveRequest => ({
    history_id: historyId.value ?? 0,
    question_id: questionId,
    choice_answers: answers.length > 0 ? answers : null,
  })

  /**
   * 执行单题保存（消费队列）：
   * - 发送前先清理该题定时器/队列，防止重复发同一 payload；
   * - 回包时必须校验 version 仍是最新，才允许回写 UI 状态。
   */
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

    /** 执行当前队列 payload 的真实请求，并在完成后清理 in-flight 状态。 */
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

  /**
   * 入队并防抖保存：
   * - history 未就绪或已提交锁定时不再入队；
   * - 若签名与“已保存”或“已排队”一致则跳过，避免无效请求；
   * - 每次入队都会提升版本号，确保状态回写只接受最新编辑。
   */
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

  /**
   * 强制落盘：
   * - 先立即执行所有已排队请求；
   * - 再等待所有飞行中请求结束；
   * 常用于 submit/reset 前，保证后续操作基于后端最新答案。
   */
  const flush = async () => {
    const queuedQuestionIds = Array.from(queuedPayloadMap.keys())
    await Promise.all(queuedQuestionIds.map((questionId) => executeQueuedSave(questionId)))
    await Promise.allSettled(Array.from(inFlightPromiseMap.values()))
  }

  /** 重置自动保存内部状态（重置题集后调用，避免旧状态污染新一轮作答）。 */
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

  // 题目结构变化时先同步状态容器，避免旧题残留队列影响当前题集。
  watch(questions, syncQuestionSaveStateMap, { immediate: true })

  // 首次 hydrate 后应用后端已保存信息，避免进入页面即重复保存。
  watch([isHydrated, initialSavedQuestionIds], applyInitialSavedState, { immediate: true })

  // 监听用户作答变化：按题号触发 queueSave（防抖 + 去重 + 版本控制）。
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

  /**
   * 已保存进度口径：
   * - 必须“有答案”且“最近一次保存状态为 saved”才计入；
   * - 该值直接用于驱动侧边栏 history.progress。
   */
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
