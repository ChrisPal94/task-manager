import { http } from './http'
import type { AuthResponse } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    http.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
}
