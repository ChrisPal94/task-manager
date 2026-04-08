import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TaskPriority, TaskStatus } from '@/types'

export const STATUS_STYLES: Record<TaskStatus, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100   text-blue-800',
  completed:   'bg-green-100  text-green-800',
}

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low:    'bg-gray-100  text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high:   'bg-red-100   text-red-700',
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day:   '2-digit',
    year:  'numeric',
  })
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function truncate(str: string, maxLen = 80): string {
  return str.length <= maxLen ? str : `${str.slice(0, maxLen)}…`
}

const TOKEN_KEY = 'tm_token'
const USER_KEY  = 'tm_user'

export const storage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clearToken: (): void => localStorage.removeItem(TOKEN_KEY),

  getUser: <T>(): T | null => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as T } catch { return null }
  },
  setUser: (user: unknown): void => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: (): void => localStorage.removeItem(USER_KEY),

  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

export function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const res = (error as { response?: { data?: { message?: string | string[] } } }).response
    const msg = res?.data?.message
    if (Array.isArray(msg)) return msg[0]
    if (typeof msg === 'string') return msg
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
