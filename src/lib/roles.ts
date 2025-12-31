// Role hierarchy and permissions

export const UserRole = {
  TOP_USER: 'TOP_USER',
  SUPER_USER: 'SUPER_USER',
  ADMIN: 'ADMIN',
  USER: 'USER',
  CLIENT: 'CLIENT',
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export const ROLE_HIERARCHY = {
  [UserRole.TOP_USER]: 5,
  [UserRole.SUPER_USER]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.USER]: 2,
  [UserRole.CLIENT]: 1,
}

export function canCreateRole(creatorRole: string, targetRole: string): boolean {
  // USER cannot create anyone
  if (creatorRole === UserRole.USER) return false
  
  // CLIENT cannot be created through this module
  if (targetRole === UserRole.CLIENT) return false
  
  // TOP_USER cannot be created
  if (targetRole === UserRole.TOP_USER) return false
  
  // SUPER_USER can only be created by TOP_USER
  if (targetRole === UserRole.SUPER_USER) {
    return creatorRole === UserRole.TOP_USER
  }
  
  // ADMIN can be created by TOP_USER or SUPER_USER
  if (targetRole === UserRole.ADMIN) {
    return creatorRole === UserRole.TOP_USER || creatorRole === UserRole.SUPER_USER
  }
  
  // USER can be created by ADMIN, SUPER_USER, or TOP_USER
  if (targetRole === UserRole.USER) {
    return creatorRole === UserRole.ADMIN || creatorRole === UserRole.SUPER_USER || creatorRole === UserRole.TOP_USER
  }
  
  return false
}

export function getCreatableRoles(creatorRole: string): string[] {
  switch (creatorRole) {
    case UserRole.TOP_USER:
      return [UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER]
    case UserRole.SUPER_USER:
      return [UserRole.ADMIN, UserRole.USER]
    case UserRole.ADMIN:
      return [UserRole.USER]
    default:
      return []
  }
}

export function canAccessRoute(userRole: string, route: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    [UserRole.TOP_USER]: ['/app/dashboard', '/app/team', '/app/projects', '/app/tasks', '/app/time', '/app/invoices', '/app/clients', '/app/settings'],
    [UserRole.SUPER_USER]: ['/app/dashboard', '/app/team', '/app/projects', '/app/tasks', '/app/time', '/app/invoices', '/app/clients', '/app/settings'],
    [UserRole.ADMIN]: ['/app/dashboard', '/app/team', '/app/projects', '/app/tasks', '/app/time', '/app/invoices', '/app/clients', '/app/settings'],
    [UserRole.USER]: ['/app/dashboard', '/app/team', '/app/projects', '/app/tasks', '/app/time', '/app/clients', '/app/settings'],
    [UserRole.CLIENT]: ['/app/dashboard', '/app/projects', '/app/settings'],
  }
  
  const allowedRoutes = rolePermissions[userRole] || []
  return allowedRoutes.some(allowed => route.startsWith(allowed))
}

export function getNavigationItems(userRole: string) {
  const allItems = [
    { name: 'Dashboard', href: '/app/dashboard', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER, UserRole.CLIENT] },
    { name: 'Team', href: '/app/team', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER] },
    { name: 'Projects', href: '/app/projects', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER, UserRole.CLIENT] },
    { name: 'Tasks', href: '/app/tasks', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER] },
    { name: 'Time Tracking', href: '/app/time', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER] },
    { name: 'Invoices', href: '/app/invoices', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN] },
    { name: 'Clients', href: '/app/clients', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER] },
    { name: 'CRM', href: '/app/crm', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER] },
    { name: 'Settings', href: '/app/settings', roles: [UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER, UserRole.CLIENT] },
  ]
  
  return allItems.filter(item => item.roles.includes(userRole as UserRole))
}

export function canCreateTeam(userRole: string): boolean {
  return userRole === UserRole.TOP_USER || userRole === UserRole.SUPER_USER
}

export function canCreateUser(userRole: string): boolean {
  return userRole === UserRole.TOP_USER || userRole === UserRole.SUPER_USER || userRole === UserRole.ADMIN
}

export function canViewAllTeams(userRole: string): boolean {
  return userRole === UserRole.TOP_USER
}

export function canViewAllUsers(userRole: string): boolean {
  return userRole === UserRole.TOP_USER
}
