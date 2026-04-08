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
