import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './app/queryClient'
import { router } from './app/router'
import { useThemeStore } from './app/themeStore'
import { OnboardingProvider } from './contexts/OnboardingContext'
import './index.css'

// Initialize theme on app startup
const initializeTheme = () => {
  const theme = useThemeStore.getState().theme
  if (theme === 'dark-sage') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

initializeTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OnboardingProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </OnboardingProvider>
    </QueryClientProvider>
  </StrictMode>,
)
