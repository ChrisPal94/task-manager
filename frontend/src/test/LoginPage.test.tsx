import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'

const mockLogin = vi.fn()
const mockSetLocale = vi.fn()
const mockNavigate = vi.fn()
let mockIsLoading = false

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, isLoading: mockIsLoading }),
}))

vi.mock('@/context/LangContext', () => ({
  useLang: () => ({
    t: (key: string) =>
      ({
        appTagline: 'Sign in to your account',
        email: 'Email',
        emailPlaceholder: 'you@example.com',
        password: 'Password',
        signIn: 'Sign in',
        loginFailed: 'Login failed',
        errorInvalidCredentials: 'The email or password you entered is incorrect.',
        errorUnauthorized: 'Your session has expired. Please sign in again.',
        errorForbidden: 'You do not have permission to perform this action.',
        errorNotFound: 'The requested resource could not be found.',
        errorValidation: 'Some fields contain invalid data. Please review your input.',
        errorTooManyRequests: 'Too many attempts. Please wait a moment and try again.',
        errorServerError: 'Something went wrong on our end. Please try again later.',
        errorNetworkError: 'Unable to reach the server. Check your internet connection.',
        errorUnexpected: 'An unexpected error occurred. Please try again.',
      })[key] ?? key,
    locale: 'en',
    setLocale: mockSetLocale,
  }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockIsLoading = false
})

describe('LoginPage', () => {
  it('renders the email and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders the sign in button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('calls login with the entered credentials on submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('alice@example.com', 'password123')
    })
  })

  it('navigates to /tasks on successful login', async () => {
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/tasks', { replace: true })
    })
  })

  it('shows an error message on failed login', async () => {
    const axiosError = { response: { status: 401 } }
    mockLogin.mockRejectedValue(axiosError)
    renderLogin()

    await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(
        screen.getByText('The email or password you entered is incorrect.'),
      ).toBeInTheDocument()
    })
  })

  it('switches locale when a language button is clicked', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'ES' }))
    expect(mockSetLocale).toHaveBeenCalledWith('es')
  })

  it('disables the submit button while login is in progress', () => {
    mockIsLoading = true
    renderLogin()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled()
  })
})
