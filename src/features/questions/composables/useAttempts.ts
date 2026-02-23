/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useAttempts）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import type { Attempt, Response } from '@/types'
import { onScopeDispose, shallowRef } from 'vue'

/**
 * 获取指定题集（historyId）的历史作答记录。
 *
 * 设计与 useQuestions 对称，同样支持手动取消和作用域自动取消，
 * 避免切换题集时旧请求的结果错误地回写到新题集的 attempts 状态中。
 *
 * @param historyId - 题集 ID，对应后端 history_id 查询参数
 */
export function useAttempts(historyId: number) {
  /** 是否正在请求中 */
  const isFetching = shallowRef(false)
  /** 已加载的历史作答列表（每项包含 question_id 和 user_answers） */
  const attempts = shallowRef<Attempt[]>([])
  /** 请求失败时的错误信息（null 表示无错误） */
  const error = shallowRef<string | null>(null)

  /** 当前进行中请求的 AbortController */
  let controller: AbortController | null = null

  /**
   * 取消当前请求并重置加载状态。
   * 在发起新请求前或外部主动取消时调用。
   */
  const cancel = () => {
    controller?.abort()
    controller = null
    isFetching.value = false
  }

  /**
   * 拉取历史作答记录：
   * 1. 先取消上一次未完成的请求；
   * 2. AbortError/CanceledError 不作为错误处理；
   * 3. finally 中通过引用比较仅由最新请求重置 isFetching。
   */
  const fetchAttempts = async () => {
    cancel()

    const requestController = new AbortController()
    controller = requestController
    isFetching.value = true
    error.value = null

    try {
      const response = await axios.get<Response<Attempt[]>>('/attempt', {
        params: { history_id: historyId },
        signal: requestController.signal,
      })
      attempts.value = response.data.data ?? []
    } catch (requestError) {
      const isAbortError =
        requestError instanceof Error &&
        (requestError.name === 'AbortError' || requestError.name === 'CanceledError')

      if (!isAbortError) {
        error.value = requestError instanceof Error ? requestError.message : String(requestError)
      }
    } finally {
      if (controller === requestController) {
        isFetching.value = false
      }
    }
  }

  // 作用域销毁时自动取消，防止组件卸载后继续回写 attempts 状态
  onScopeDispose(cancel)

  // 创建时立即加载
  void fetchAttempts()

  return { attempts, error, isFetching, fetchAttempts, cancel }
}
