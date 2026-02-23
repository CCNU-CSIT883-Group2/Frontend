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

export function useAttempts(historyId: number) {
  const isFetching = shallowRef(false)
  const attempts = shallowRef<Attempt[]>([])
  const error = shallowRef<string | null>(null)

  let controller: AbortController | null = null

  const cancel = () => {
    controller?.abort()
    controller = null
    isFetching.value = false
  }

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

  onScopeDispose(cancel)

  void fetchAttempts()

  return { attempts, error, isFetching, fetchAttempts, cancel }
}
