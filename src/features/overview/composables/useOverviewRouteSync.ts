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

/** useOverviewRouteSync 的入参 */
interface UseOverviewRouteSyncOptions {
  /** 当前路由的查询参数（已类型转换） */
  routeQuery: ComputedRef<Record<string, unknown>>
  /** 当前选中的学科（双向同步目标） */
  selectedSubject: Ref<string>
  /** 当前选中的标签（双向同步目标） */
  selectedTag: Ref<string>
  /** 是否处于单科视图（selectedSubject 非空） */
  isTagView: ComputedRef<boolean>
  /** 标记本次 subject 变更是由响应自动修正（跳过额外的 refreshCharts） */
  isSubjectPatchedFromResponse: Ref<boolean>
  /** 标记是否已完成初始刷新（防止 week_start/tz 变化时重复刷新） */
  isInitialRefreshTriggered: Ref<boolean>
  /** 当前 URL 中的 week_start 参数 */
  routeWeekStart: ComputedRef<string>
  /** 当前 URL 中的 tz 参数 */
  routeTimeZone: ComputedRef<string>
  /** 将 selectedSubject 写回 URL query 的函数 */
  syncRouteSubject: (subject: string) => void
  /** 将 selectedTag 写回 URL query 的函数 */
  syncRouteTag: (tag: string) => void
  /** 从 query 对象中提取 subject 字段的辅助函数 */
  getSubjectFromQuery: (query: Record<string, unknown>) => string
  /** 从 query 对象中提取 tag 字段的辅助函数 */
  getTagFromQuery: (query: Record<string, unknown>) => string
  /** 触发数据刷新的函数（请求后端并更新图表） */
  refreshCharts: () => Promise<void>
  /** 标签切换时的轻量级回调（不重新请求，仅重算图表） */
  onTagChanged: (tag: string) => void
}

/**
 * Overview 统计页的路由与状态双向同步 composable。
 *
 * 解决的核心问题：
 * URL → 状态 和 状态 → URL 两个方向的同步会相互触发循环，
 * 使用 vueuse/watchIgnorable 精准抑制"回环更新"：
 * - 路由 query 变化（用户直接修改 URL 或前进/后退）→ 更新 selectedSubject/selectedTag；
 * - selectedSubject/selectedTag 变化（用户点击 UI）→ 写回 URL query，并触发 refreshCharts。
 *
 * 额外逻辑：
 * - week_start 或 tz 参数变化时，若数据已初始化，则自动重新拉取图表数据；
 * - selectedTag 变化时，调用 onTagChanged 做本地轻量级重算（避免重复请求）。
 */
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
  /**
   * 抑制由路由 → 状态方向同步引起的"状态 → 路由"回调触发。
   * 初始为直通函数（不使用 ignoreUpdates 的默认行为），
   * 在 watchIgnorable 初始化后替换为真正的 ignoreUpdates 函数。
   */
  let ignoreSubjectRouteUpdate: (updater: () => void) => void = (updater) => updater()
  let ignoreTagRouteUpdate: (updater: () => void) => void = (updater) => updater()

  // 路由 → 状态同步：URL query 变化时将 subject/tag 回填到 selectedSubject/selectedTag。
  // 使用 ignoreSubjectRouteUpdate/ignoreTagRouteUpdate 包裹赋值，
  // 防止触发下方"状态 → 路由"的 watch 并造成循环。
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
    { immediate: true }, // 立即执行确保初始化时从 URL 中读取初始值
  )

  // 状态 → 路由同步（subject）：用户在 UI 中选择学科时写回 URL。
  // isSubjectPatchedFromResponse 为 true 时说明是响应自动修正，跳过 refreshCharts。
  const { ignoreUpdates: ignoreSubjectSelectionUpdate } = watchIgnorable(
    selectedSubject,
    (subject) => {
      syncRouteSubject(subject)

      if (isSubjectPatchedFromResponse.value) {
        // 响应自动修正：重置标志，不额外触发 refreshCharts（由上层刷新流程负责）
        isSubjectPatchedFromResponse.value = false
        return
      }

      isInitialRefreshTriggered.value = true
      void refreshCharts()
    },
    { immediate: true }, // 立即执行确保初始化时同步到路由
  )
  // 将 ignoreUpdates 函数赋给路由监听器，用于抑制回环
  ignoreSubjectRouteUpdate = ignoreSubjectSelectionUpdate

  // 状态 → 路由同步（tag）：用户切换标签时写回 URL 并触发轻量级图表更新。
  // 非单科视图时不同步（tag 只在 selectedSubject 非空时有意义）。
  const { ignoreUpdates: ignoreTagSelectionUpdate } = watchIgnorable(selectedTag, (tag) => {
    if (!isTagView.value) {
      return
    }

    syncRouteTag(tag)
    onTagChanged(tag)
  })
  ignoreTagRouteUpdate = ignoreTagSelectionUpdate

  // 监听周起始日和时区变化：这两个参数会影响统计口径，需要重新拉取数据。
  // 只有已完成初始刷新后才响应，避免初始化时重复请求。
  watch(
    [routeWeekStart, routeTimeZone],
    ([nextWeekStart, nextTimeZone], [prevWeekStart, prevTimeZone]) => {
      // 值未变化时不触发（watch 首次执行时 prev 为 undefined，此处安全）
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
