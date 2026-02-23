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
  buildRequestParams,
  getTagFromQuery,
} from '@/features/overview/composables/overviewStatistics.helpers'
import type {
  OverviewDashboardData,
  OverviewSubjectDashboardData,
  Response,
} from '@/types'

/** fetchOverviewDashboardData 的入参 */
interface FetchOverviewDashboardOptions {
  /** 当前路由查询参数（用于提取 week_start / tz 等过滤条件） */
  routeQuery: Record<string, unknown>
}

/**
 * 获取全局概览仪表板数据。
 * 请求后端 /dashboard/overview 接口，携带时区和周起始等参数。
 */
export const fetchOverviewDashboardData = async ({
  routeQuery,
}: FetchOverviewDashboardOptions) => {
  const response = await axios.get<Response<OverviewDashboardData>>('/dashboard/overview', {
    params: buildRequestParams(routeQuery),
  })

  return response.data.data
}

/** fetchOverviewSubjectDashboardData 的入参 */
interface FetchOverviewSubjectDashboardOptions {
  /** 当前选中的学科名称 */
  subject: string
  /** 当前路由查询参数 */
  routeQuery: Record<string, unknown>
}

/**
 * 获取指定学科的细分概览数据。
 * 请求后端 /dashboard/overview/subject，附带 subject 和 tag 过滤条件。
 */
export const fetchOverviewSubjectDashboardData = async ({
  subject,
  routeQuery,
}: FetchOverviewSubjectDashboardOptions) => {
  const response = await axios.get<Response<OverviewSubjectDashboardData>>(
    '/dashboard/overview/subject',
    {
      // 同时传入 subject 和从 URL 中提取的 tag 作为过滤条件
      params: buildRequestParams(routeQuery, subject, getTagFromQuery(routeQuery)),
    },
  )

  return response.data.data
}
