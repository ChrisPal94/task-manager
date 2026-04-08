import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api'
import { AUTH_EXPIRED_EVENT } from '@/api/http'
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = storage.getToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then((freshUser) => {
        storage.setUser(freshUser)
        setUser(freshUser)
      })
      .catch(() => {
        storage.clear()
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const handleExpired = () => {
      queryClient.clear()
      setUser(null)
      navigate('/login', { replace: true })
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [navigate, queryClient])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await authApi.login(email, password)
      storage.setToken(data.access_token)
      storage.setUser(data.user)
      setUser(data.user)
    } catch (err) {
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    storage.clear()
    queryClient.clear()
    setUser(null)
  }, [queryClient])

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

export { getApiErrorMessage }
