import { http } from './http'
import type { AuthResponse, User } from '@/types'

export const authApi = {
  login: (email: string, password: string) =>
    http.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  me: () => http.get<User>('/auth/me').then((r) => r.data),
}
