import { useLang } from '@/context/LangContext'
import type { Locale } from '@/i18n/translations'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

export function LocaleSwitcher() {
  const { locale, setLocale } = useLang()

  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          className={`px-2.5 py-1 font-medium transition-colors ${
            locale === value ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
