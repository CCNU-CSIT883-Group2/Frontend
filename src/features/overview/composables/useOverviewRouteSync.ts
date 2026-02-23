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

      void refreshCharts()
    },
  )
}
