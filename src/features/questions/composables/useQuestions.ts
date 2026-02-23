/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 questions 领域的状态管理与副作用流程（模块：useQuestions）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import type { Question, Response } from '@/types'
import { onScopeDispose, shallowRef } from 'vue'

/**
 * 获取指定题集（historyId）的题目列表。
 *
 * 功能：
 * 1. 组合式创建时立即发起请求；
 * 2. 通过 AbortController 支持手动取消（切换题集时先取消旧请求）；
 * 3. 作用域销毁时自动取消，防止组件已卸载后继续回写状态。
 *
 * @param historyId - 题集 ID，对应后端 history_id 查询参数
 */
export function useQuestions(historyId: number) {
  /** 是否正在请求中 */
  const isFetching = shallowRef(false)
  /** 已加载的题目列表 */
  const questions = shallowRef<Question[]>([])
  /** 请求失败时的错误信息（null 表示无错误） */
  const error = shallowRef<string | null>(null)

  /** 当前进行中请求的 AbortController，用于在需要时取消 */
  let controller: AbortController | null = null

  /**
   * 取消当前进行中的请求并重置 isFetching。
   * 在 fetchQuestions 开头调用，确保同一时刻只有一个请求在飞行。
   */
  const cancel = () => {
    controller?.abort()
    controller = null
    isFetching.value = false
  }

  /**
   * 拉取题目列表：
   * 1. 先取消上一次未完成的请求（防止旧结果覆盖新结果）；
   * 2. 捕获 AbortError/CanceledError，视为正常取消，不写入 error；
   * 3. finally 中通过 controller 引用比较判断是否为最新请求，避免旧请求重置 isFetching。
   */
  const fetchQuestions = async () => {
    cancel()

    const requestController = new AbortController()
    controller = requestController
    isFetching.value = true
    error.value = null

    try {
      const response = await axios.get<Response<Question[]>>('/questions', {
        params: { history_id: historyId },
        signal: requestController.signal,
      })
      questions.value = response.data.data ?? []
    } catch (requestError) {
      // AbortError（原生 fetch）和 CanceledError（axios）均视为取消，不作为错误处理
      const isAbortError =
        requestError instanceof Error &&
        (requestError.name === 'AbortError' || requestError.name === 'CanceledError')

      if (!isAbortError) {
        error.value = requestError instanceof Error ? requestError.message : String(requestError)
      }
    } finally {
      // 只有当前控制器与最新控制器一致时才重置，避免旧请求的 finally 干扰新请求
      if (controller === requestController) {
        isFetching.value = false
      }
    }
  }

  // 作用域（组件或 effectScope）销毁时自动取消飞行中的请求
  onScopeDispose(cancel)

  // 创建时立即加载
  void fetchQuestions()

  return { questions, error, isFetching, fetchQuestions, cancel }
}
