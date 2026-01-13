import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useUserRole } from '@/hooks/useUserRole'

interface OnboardingState {
  onboardingStarted: boolean
  completedSteps: string[]
  onboardingCompleted: boolean
  dismissed: boolean
}

interface OnboardingContextType extends OnboardingState {
  startOnboarding: () => void
  completeStep: (step: string) => void
  dismissOnboarding: () => void
  resetOnboarding: () => void
  shouldShowOnboarding: boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

const STORAGE_KEY = 'opspilot_onboarding'

const INITIAL_STATE: OnboardingState = {
  onboardingStarted: false,
  completedSteps: [],
  onboardingCompleted: false,
  dismissed: false,
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { role } = useUserRole()
  const [state, setState] = useState<OnboardingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return INITIAL_STATE
      }
    }
    return INITIAL_STATE
  })

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const startOnboarding = () => {
    setState(prev => ({ ...prev, onboardingStarted: true }))
  }

  const completeStep = (step: string) => {
    setState(prev => {
      if (prev.completedSteps.includes(step)) return prev
      
      const newCompletedSteps = [...prev.completedSteps, step]
      const allStepsCompleted = getRequiredSteps(role).every(s => newCompletedSteps.includes(s))
      
      return {
        ...prev,
        completedSteps: newCompletedSteps,
        onboardingCompleted: allStepsCompleted,
      }
    })
  }

  const dismissOnboarding = () => {
    setState(prev => ({ ...prev, dismissed: true }))
  }

  const resetOnboarding = () => {
    setState(INITIAL_STATE)
  }

  // CLIENT users don't get onboarding
  const shouldShowOnboarding = role !== 'CLIENT' && 
    state.onboardingStarted && 
    !state.onboardingCompleted && 
    !state.dismissed

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        startOnboarding,
        completeStep,
        dismissOnboarding,
        resetOnboarding,
        shouldShowOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}

// Get required steps based on role
function getRequiredSteps(role: string | null): string[] {
  const baseSteps = ['client', 'team', 'project', 'phase', 'task', 'time']
  
  // USER role gets CRM but not invoice
  if (role === 'USER') {
    return [...baseSteps, 'crm']
  }
  
  // TOP_USER, SUPER_USER, ADMIN get CRM + invoice
  return [...baseSteps, 'crm', 'invoice']
}
