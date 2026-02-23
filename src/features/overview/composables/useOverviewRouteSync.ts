/**
 * 文件说明（是什么）：
 * - 本文件是「组合式逻辑模块」。
 * - 封装 overview 领域的状态管理与副作用流程（模块：useOverviewRouteSync）。
 *
 * 设计原因（为什么）：
 * - 把复杂逻辑从组件模板中抽离，保证组件更聚焦于渲染职责。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import { watchIgnorable } from '@vueuse/core'
import { watch, type ComputedRef, type Ref } from 'vue'

interface UseOverviewRouteSyncOptions {
  routeQuery: ComputedRef<Record<string, unknown>>
  selectedSubject: Ref<string>
  selectedTag: Ref<string>
  isTagView: ComputedRef<boolean>
  isSubjectPatchedFromResponse: Ref<boolean>
  isInitialRefreshTriggered: Ref<boolean>
  routeWeekStart: ComputedRef<string>
  routeTimeZone: ComputedRef<string>
  syncRouteSubject: (subject: string) => void
  syncRouteTag: (tag: string) => void
  getSubjectFromQuery: (query: Record<string, unknown>) => string
  getTagFromQuery: (query: Record<string, unknown>) => string
  refreshCharts: () => Promise<void>
  onTagChanged: (tag: string) => void
}

export const useOverviewRouteSync = ({
  routeQuery,
  selectedSubject,
  selectedTag,
  isTagView,
  isSubjectPatchedFromResponse,
  isInitialRefreshTriggered,
  routeWeekStart,
  routeTimeZone,
  syncRouteSubject,
  syncRouteTag,
  getSubjectFromQuery,
  getTagFromQuery,
  refreshCharts,
  onTagChanged,
}: UseOverviewRouteSyncOptions) => {
  let ignoreSubjectRouteUpdate: (updater: () => void) => void = (updater) => updater()
  let ignoreTagRouteUpdate: (updater: () => void) => void = (updater) => updater()

  // 路由 -> 状态：URL 变化时回填 subject/tag。
  watchIgnorable(
    routeQuery,
    (query) => {
      const querySubject = getSubjectFromQuery(query)
      const queryTag = getTagFromQuery(query)

      ignoreSubjectRouteUpdate(() => {
        selectedSubject.value = querySubject
      })

      ignoreTagRouteUpdate(() => {
        selectedTag.value = queryTag
      })
    },
    { immediate: true },
  )

  const { ignoreUpdates: ignoreSubjectSelectionUpdate } = watchIgnorable(
    selectedSubject,
    (subject) => {
      // 状态 -> 路由：用户选择变化后同步回 query。
      syncRouteSubject(subject)

      if (isSubjectPatchedFromResponse.value) {
        isSubjectPatchedFromResponse.value = false
        return
      }

      isInitialRefreshTriggered.value = true
      void refreshCharts()
    },
    { immediate: true },
  )
  ignoreSubjectRouteUpdate = ignoreSubjectSelectionUpdate

  const { ignoreUpdates: ignoreTagSelectionUpdate } = watchIgnorable(selectedTag, (tag) => {
    if (!isTagView.value) {
      return
    }

    syncRouteTag(tag)
    onTagChanged(tag)
  })
  ignoreTagRouteUpdate = ignoreTagSelectionUpdate

  watch(
    [routeWeekStart, routeTimeZone],
    ([nextWeekStart, nextTimeZone], [prevWeekStart, prevTimeZone]) => {
      if (nextWeekStart === prevWeekStart && nextTimeZone === prevTimeZone) {
        return
      }

      if (!isInitialRefreshTriggered.value) {
        return
      }

      // 周起始日或时区变化会影响统计口径，需要重新拉取图表数据。
      void refreshCharts()
    },
  )
}
