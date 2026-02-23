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

export const submitProfileUpdate = async (
  payload: ProfileUpdateRequest,
  fallbackErrorMessage: string,
) => {
  const response = await axios.post<Response<unknown>>('/profile', payload)
  if (response.data.code !== 200) {
    throw new Error(response.data.info || fallbackErrorMessage)
  }

  return response.data.info
}

export const submitLogout = async () => {
  await axios.post('/logout')
}
