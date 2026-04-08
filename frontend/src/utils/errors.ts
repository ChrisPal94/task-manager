import type { TranslationKey } from '@/i18n/translations'

/**
 * Maps any API/network error to a TranslationKey so the UI can display
 * a locale-aware, user-friendly message instead of a raw technical one.
 *
 * Priority order:
 *  1. HTTP status code  → deterministic mapping
 *  2. Network failure   → no response at all
 *  3. Fallback          → generic unexpected error
 */
export function getApiErrorKey(error: unknown): TranslationKey {
  if (typeof error === 'object' && error !== null) {
    // Axios-shaped error with an HTTP response
    if ('response' in error) {
      const status = (error as { response?: { status?: number } }).response?.status
      switch (status) {
        case 400: return 'errorValidation'
        case 401: return 'errorInvalidCredentials'
        case 403: return 'errorForbidden'
        case 404: return 'errorNotFound'
        case 429: return 'errorTooManyRequests'
        default:
          if (status !== undefined && status >= 500) return 'errorServerError'
      }
    }

    // Axios network error — no response received
    if ('request' in error && !('response' in error)) {
      return 'errorNetworkError'
    }
  }

  return 'errorUnexpected'
}

/**
 * Variant used in contexts where a translated string is already available
 * (e.g. server-side validation messages from NestJS class-validator).
 * Falls back to getApiErrorKey when there is no readable message.
 */
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
