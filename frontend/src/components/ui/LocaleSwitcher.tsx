import { useLang } from '@/context/LangContext'
import { useTheme } from '@/context/ThemeContext'
import type { Locale } from '@/i18n/translations'

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLang()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
        {LOCALES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setLocale(value)}
            className={`px-2.5 py-1 font-medium transition-colors ${
              locale === value
                ? 'bg-brand-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        aria-label={theme === 'light' ? t('darkMode') : t('lightMode')}
        className="flex items-center justify-center h-[26px] w-[26px] rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        {theme === 'light' ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        )}
      </button>
    </div>
  )
}
