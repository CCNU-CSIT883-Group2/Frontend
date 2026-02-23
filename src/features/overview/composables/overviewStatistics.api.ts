/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 overview 领域的计算、共享与适配能力（模块：overviewStatistics.api）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import axios from '@/axios'
import {
  buildOverviewDashboardMockData,
  buildOverviewSubjectDashboardMockData,
} from '@/features/overview/mocks/overviewDashboardMock'
import {
  buildRequestParams,
  getTagFromQuery,
} from '@/features/overview/composables/overviewStatistics.helpers'
import type {
  OverviewDashboardData,
  OverviewSubjectDashboardData,
  Response,
} from '@/types'

interface FetchOverviewDashboardOptions {
  isMockMode: boolean
  subjects: string[]
  routeQuery: Record<string, unknown>
}

export const fetchOverviewDashboardData = async ({
  isMockMode,
  subjects,
  routeQuery,
}: FetchOverviewDashboardOptions) => {
  if (isMockMode) {
    return buildOverviewDashboardMockData(subjects)
  }

  const response = await axios.get<Response<OverviewDashboardData>>('/dashboard/overview', {
    params: buildRequestParams(routeQuery),
  })

  return response.data.data
}

interface FetchOverviewSubjectDashboardOptions {
  isMockMode: boolean
  subject: string
  subjects: string[]
  routeQuery: Record<string, unknown>
}

export const fetchOverviewSubjectDashboardData = async ({
  isMockMode,
  subject,
  subjects,
  routeQuery,
}: FetchOverviewSubjectDashboardOptions) => {
  if (isMockMode) {
    return buildOverviewSubjectDashboardMockData(subject, subjects)
  }

  const response = await axios.get<Response<OverviewSubjectDashboardData>>(
    '/dashboard/overview/subject',
    {
      params: buildRequestParams(routeQuery, subject, getTagFromQuery(routeQuery)),
    },
  )

  return response.data.data
}
