/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 profile 领域的计算、共享与适配能力（模块：profileWorkspace.helpers）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateProfileName = (name: string) => {
  if (!name) return 'Name is required.'
  if (name.length < 2) return 'Name must be at least 2 characters.'
  return ''
}

export const validateProfileEmail = (email: string) => {
  if (!email) return 'Email is required.'
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.'
  return ''
}

export const getProfileInitials = (name: string, email: string) => {
  const nameSegments = name
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (nameSegments.length > 0) {
    return nameSegments
      .slice(0, 2)
      .map((segment) => segment.charAt(0).toUpperCase())
      .join('')
  }

  return (email.charAt(0) || 'U').toUpperCase()
}

export const formatLastSavedAt = (value: Date | null) => {
  if (!value) return 'Not synced in this session'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}
