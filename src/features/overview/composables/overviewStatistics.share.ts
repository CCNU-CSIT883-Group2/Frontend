/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 overview 领域的计算、共享与适配能力（模块：overviewStatistics.share）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

/** shareOverviewStatistics 的入参 */
interface ShareOverviewStatisticsOptions {
  /** 当前选中学科名称，为空时不执行分享 */
  subject: string
  /** 是否支持 Clipboard API（由调用方通过 vueuse/useClipboard 检测） */
  isClipboardSupported: boolean
  /** 将文本写入剪贴板的函数（来自 vueuse/useClipboard） */
  copyToClipboard: (text: string) => Promise<void>
}

/**
 * 分享当前统计页面。
 *
 * 优先级：
 * 1. 若浏览器支持原生 Web Share API（`navigator.share`），优先调用；
 * 2. 若不支持 Share API 但支持 Clipboard API，将当前 URL 复制到剪贴板；
 * 3. 均不支持时返回提示信息。
 *
 * 返回 null 表示分享/复制成功，返回字符串表示操作失败或不支持（由调用方展示提示）。
 */
export const shareOverviewStatistics = async ({
  subject,
  isClipboardSupported,
  copyToClipboard,
}: ShareOverviewStatisticsOptions): Promise<string | null> => {
  // 未选择学科时无需分享
  if (!subject) return null

  const shareText = `Check out my stats for ${subject}!`

  if (navigator.share) {
    try {
      // 使用原生分享弹窗，体验最佳（移动端尤其友好）
      await navigator.share({
        title: 'Share My Statistics',
        text: shareText,
        url: window.location.href,
      })
    } catch {
      // 用户主动关闭分享弹窗（AbortError），静默处理，不视为错误
    }
    return null
  }

  if (!isClipboardSupported) {
    return 'Sharing is not supported in this browser.'
  }

  try {
    // 回退方案：复制当前页 URL 到剪贴板
    await copyToClipboard(window.location.href)
    return 'Sharing is not supported. URL copied to clipboard.'
  } catch {
    return 'Sharing is not supported in this browser.'
  }
}
