import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLang } from '@/context/LangContext'
import { Button, Input } from '@/components/ui'
import type { Locale } from '@/i18n/translations'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const { t, locale, setLocale } = useLang()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate('/tasks', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loginFailed'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden text-sm">
            {LOCALES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLocale(value)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  locale === value ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white text-xl font-bold mb-3">
            T
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-1">{t('appTagline')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form
            onSubmit={(e) => {
              void handleSubmit(e)
            }}
            noValidate
            className="space-y-5"
          >
            <Input
              label={t('email')}
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
            <Input
              label={t('password')}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              {t('signIn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
