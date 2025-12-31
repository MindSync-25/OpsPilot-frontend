import { useAuthStore } from '@/app/store'
import { UserRole } from '@/lib/roles'

export function useUserRole() {
  const { user } = useAuthStore()
  
  const isTopUser = user?.role === UserRole.TOP_USER
  const isSuperUser = user?.role === UserRole.SUPER_USER
  const isAdmin = user?.role === UserRole.ADMIN
  const isUser = user?.role === UserRole.USER
  const isClient = user?.role === UserRole.CLIENT
  
  return {
    user,
    role: user?.role || '',
    teamId: user?.teamId,
    isTopUser,
    isSuperUser,
    isAdmin,
    isUser,
    isClient,
    canManageTeams: isTopUser || isSuperUser,
    canManageUsers: isTopUser || isSuperUser || isAdmin,
    
    // Project permissions
    canCreateProject: () => isTopUser || isSuperUser || isAdmin,
    canEditProject: () => isTopUser || isSuperUser || isAdmin,
    canDeleteProject: () => isTopUser || isSuperUser || isAdmin,
    canViewAllProjects: () => isTopUser || isSuperUser || isAdmin,
    
    // Team management
    canCreateTeam: () => isTopUser || isSuperUser || isAdmin,
    canEditTeam: () => isTopUser || isSuperUser,
    canDeleteTeam: () => isTopUser || isSuperUser,
    
    // User management
    canCreateUser: () => isTopUser || isSuperUser || isAdmin,
    canEditUser: () => isTopUser || isSuperUser || isAdmin,
    canDeleteUser: () => isTopUser || isSuperUser,
    
    // Role changes
    canChangeRoles: () => isTopUser || isSuperUser,
    
    // Client permissions
    canCreateClients: isTopUser || isSuperUser || isAdmin,
    canEditClients: () => isTopUser || isSuperUser || isAdmin,
    canDeleteClients: () => isTopUser || isSuperUser || isAdmin,
  }
}
