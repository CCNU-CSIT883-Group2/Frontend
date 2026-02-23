/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 profile 领域的计算、共享与适配能力（模块：profileWorkspace.api）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import type { ProfileUpdateRequest, Response } from '@/types'

/**
 * 向后端提交用户资料更新请求（/profile 接口）。
 * - 若后端返回 code !== 200，抛出带有服务端信息的 Error，由调用方统一展示；
 * - 成功时返回后端 info 字段（用于展示成功提示）。
 */
export const submitProfileUpdate = async (
  payload: ProfileUpdateRequest,
  fallbackErrorMessage: string, // 后端信息缺失时的兜底错误文案
) => {
  const response = await axios.post<Response<unknown>>('/profile', payload)
  if (response.data.code !== 200) {
    throw new Error(response.data.info || fallbackErrorMessage)
  }

  return response.data.info
}

/**
 * 向后端提交登出请求（/logout 接口）。
 * 调用方应在此函数返回（无论成功或失败）后，继续执行本地状态清除和路由跳转。
 */
export const submitLogout = async () => {
  await axios.post('/logout')
}
