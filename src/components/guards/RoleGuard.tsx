import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { canAccessRoute } from '@/lib/roles'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function RoleGuard({ children, allowedRoles = [], redirectTo = '/app/dashboard' }: RoleGuardProps) {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // If no specific roles required, just check if user is authenticated
  if (allowedRoles.length === 0) {
    return <>{children}</>
  }
  
  // Check if user's role is in allowed roles
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />
  }
  
  return <>{children}</>
}

interface RouteGuardProps {
  children: ReactNode
  path: string
}

export function RouteGuard({ children, path }: RouteGuardProps) {
  const { user } = useAuthStore()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (!canAccessRoute(user.role, path)) {
    return <Navigate to="/app/dashboard" replace />
  }
  
  return <>{children}</>
}
