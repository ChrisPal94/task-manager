import { describe, it, expect } from 'vitest'
import { formatDate, truncate, getApiErrorMessage } from '@/utils'

describe('formatDate', () => {
  it('returns an em dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns an em dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats a date-only string correctly regardless of timezone', () => {
    expect(formatDate('2025-06-15')).toBe('Jun 15, 2025')
  })
})

describe('truncate', () => {
  it('returns the string unchanged when under the limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns the string unchanged when exactly at the limit', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and appends ellipsis when over the limit', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })

  it('uses 80 as default max length', () => {
    const long = 'a'.repeat(81)
    const result = truncate(long)
    expect(result).toHaveLength(81) // 80 chars + ellipsis
    expect(result.endsWith('…')).toBe(true)
  })
})

describe('getApiErrorMessage', () => {
  it('extracts a string message from an axios-like error', () => {
    const error = { response: { data: { message: 'Unauthorized' } } }
    expect(getApiErrorMessage(error)).toBe('Unauthorized')
  })

  it('extracts the first item when message is an array', () => {
    const error = { response: { data: { message: ['field is required', 'other error'] } } }
    expect(getApiErrorMessage(error)).toBe('field is required')
  })

  it('falls back to error.message for a plain Error', () => {
    expect(getApiErrorMessage(new Error('something broke'))).toBe('something broke')
  })

  it('returns the fallback string for unknown shapes', () => {
    expect(getApiErrorMessage('unexpected')).toBe('An unexpected error occurred')
    expect(getApiErrorMessage(null)).toBe('An unexpected error occurred')
  })
})
