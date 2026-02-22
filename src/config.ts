function getRequiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export const API_BASE_URL = getRequiredEnv('VITE_SERVER_BASE_URL')
