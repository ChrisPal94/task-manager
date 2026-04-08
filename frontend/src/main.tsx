import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 s — no redundant background refetches
      staleTime: 30_000,
      // Keep unused cache entries for 5 min before GC
      gcTime: 5 * 60_000,
      // Don't hammer the server on transient errors; retry once
      retry: 1,
      // Refetch when the user comes back to the tab
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Surface errors to the UI instead of swallowing them
      throwOnError: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LangProvider>
          <App />
        </LangProvider>
      </AuthProvider>
      {/* Devtools only in development — tree-shaken in production builds */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
