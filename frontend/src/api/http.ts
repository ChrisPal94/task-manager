import axios from 'axios'
import { storage } from '@/utils'

export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

http.interceptors.request.use((config) => {
  const token = storage.getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login')
    ) {
      storage.clear()
      window.location.replace('/login')
    }
    return Promise.reject(error)
  },
)
