import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LangProvider, useLang } from '@/context/LangContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>
}

beforeEach(() => {
  localStorage.clear()
})

describe('useLang', () => {
  it('defaults to English when no locale is saved', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.locale).toBe('en')
  })

  it('restores the saved locale from localStorage', () => {
    localStorage.setItem('tm_lang', 'es')
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.locale).toBe('es')
  })

  it('switches locale and persists it to localStorage', () => {
    const { result } = renderHook(() => useLang(), { wrapper })

    act(() => {
      result.current.setLocale('es')
    })

    expect(result.current.locale).toBe('es')
    expect(localStorage.getItem('tm_lang')).toBe('es')
  })

  it('t() returns the correct English string', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.t('signIn')).toBe('Sign in')
  })

  it('t() returns the correct Spanish string after switching', () => {
    const { result } = renderHook(() => useLang(), { wrapper })

    act(() => {
      result.current.setLocale('es')
    })

    expect(result.current.t('signIn')).toBe('Iniciar sesión')
  })

  it('throws when used outside LangProvider', () => {
    expect(() => renderHook(() => useLang())).toThrow('useLang must be used inside <LangProvider>')
  })
})
