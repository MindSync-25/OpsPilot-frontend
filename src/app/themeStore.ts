import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light-cream' | 'dark-sage'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light-cream' as Theme,
      setTheme: (theme: Theme) => {
        set({ theme })
        // Apply theme via data-theme attribute
        document.documentElement.dataset.theme = theme
        // Also maintain dark class for backward compatibility
        if (theme === 'dark-sage') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on initial load
        const theme = state?.theme || 'light-cream'
        document.documentElement.dataset.theme = theme
        if (theme === 'dark-sage') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
    }
  )
)
