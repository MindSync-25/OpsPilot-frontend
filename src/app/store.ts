import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  companyId: string
  teamId?: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      login: (token: string, user: User) => {
        set({ accessToken: token, user })
      },
      logout: () => {
        set({ accessToken: null, user: null })
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      },
      isAuthenticated: () => {
        return get().accessToken !== null && get().user !== null
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
