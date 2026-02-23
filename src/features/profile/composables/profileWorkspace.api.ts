import axios from '@/axios'
import type { ProfileUpdateRequest, Response } from '@/types'

export const submitProfileUpdate = async (
  payload: ProfileUpdateRequest,
  fallbackErrorMessage: string,
) => {
  const response = await axios.post<Response<unknown>>('/profile', payload)
  if (response.data.code !== 200) {
    throw new Error(response.data.info || fallbackErrorMessage)
  }

  return response.data.info
}

export const submitLogout = async () => {
  await axios.post('/logout')
}
