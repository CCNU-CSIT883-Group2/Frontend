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
