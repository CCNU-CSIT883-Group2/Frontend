/**
 * 文件说明（是什么）：
 * - 本文件是「领域辅助逻辑模块」。
 * - 提供 profile 领域的计算、共享与适配能力（模块：profileWorkspace.helpers）。
 *
 * 设计原因（为什么）：
 * - 将领域细分能力拆分成独立模块，便于复用和增量演进。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

/** 邮箱格式校验正则（简化版：含 @ 且前后均无空格和 @） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 校验用户名（显示名称）。
 * 返回错误信息字符串，无误时返回空字符串。
 */
export const validateProfileName = (name: string) => {
  if (!name) return 'Name is required.'
  if (name.length < 2) return 'Name must be at least 2 characters.'
  return ''
}

/**
 * 校验邮箱地址格式。
 * 返回错误信息字符串，无误时返回空字符串。
 */
export const validateProfileEmail = (email: string) => {
  if (!email) return 'Email is required.'
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.'
  return ''
}

/**
 * 根据用户名或邮箱提取头像首字母缩写（最多 2 个字符）。
 *
 * 规则：
 * 1. 将 name 按空白分割为词段，取前两段各自首字母大写后拼接；
 * 2. name 为空时，取 email 首字符大写；
 * 3. 均为空时返回 "U"（未知用户的占位符）。
 */
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

/**
 * 将 Date 对象格式化为"月 日 时:分"的字符串（如 "Jan 1, 10:00 AM"）。
 * value 为 null（本次会话内未保存过）时返回提示文案。
 */
export const formatLastSavedAt = (value: Date | null) => {
  if (!value) return 'Not synced in this session'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}
