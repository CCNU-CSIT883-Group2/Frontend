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
