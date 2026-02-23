/**
 * 文件说明（是什么）：
 * - 本文件是「运行时配置模块」。
 * - 声明项目运行所需的常量与环境配置读取逻辑。
 *
 * 设计原因（为什么）：
 * - 把配置与业务逻辑分离，降低环境切换和部署变更的风险。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

function getRequiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const API_BASE_URL = getRequiredEnv('VITE_SERVER_BASE_URL')
