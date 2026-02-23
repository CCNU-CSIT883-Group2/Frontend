/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 overview 领域的计算、共享与适配能力（模块：overviewStatistics.share）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

interface ShareOverviewStatisticsOptions {
  subject: string
  isClipboardSupported: boolean
  copyToClipboard: (text: string) => Promise<void>
}

export const shareOverviewStatistics = async ({
  subject,
  isClipboardSupported,
  copyToClipboard,
}: ShareOverviewStatisticsOptions): Promise<string | null> => {
  if (!subject) return null

  const shareText = `Check out my stats for ${subject}!`

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Share My Statistics',
        text: shareText,
        url: window.location.href,
      })
    } catch {
      // User cancelled.
    }
    return null
  }

  if (!isClipboardSupported) {
    return 'Sharing is not supported in this browser.'
  }

  try {
    await copyToClipboard(window.location.href)
    return 'Sharing is not supported. URL copied to clipboard.'
  } catch {
    return 'Sharing is not supported in this browser.'
  }
}
