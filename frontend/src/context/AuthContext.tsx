import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { authApi } from '@/api'
import { storage, getApiErrorMessage } from '@/utils'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser<User>())
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await authApi.login(email, password)
      storage.setToken(data.access_token)
      storage.setUser(data.user)
      setUser(data.user)
    } catch (err) {
      throw new Error(getApiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    storage.clear()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
