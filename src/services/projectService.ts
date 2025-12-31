import { apiClient } from '@/lib/api'

// Status and Priority as const types instead of enums
export const ProjectStatus = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus]

export const ProjectPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const

export type ProjectPriority = typeof ProjectPriority[keyof typeof ProjectPriority]

// Types
export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  priority: ProjectPriority
  clientId: string
  companyId: string
  startDate: string | null
  endDate: string | null
  projectOwnerId: string | null
  createdAt: string
  updatedAt: string
  // Derived fields (computed by backend)
  taskCount?: number
  completedTaskCount?: number
  progressPercent?: number
  totalHours?: number
  billableHours?: number
}

export interface CreateProjectRequest {
  name: string
  description?: string
  clientId: string
  status?: ProjectStatus
  priority?: ProjectPriority
  startDate?: string
  endDate?: string
  projectOwnerId?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  clientId?: string
  status?: ProjectStatus
  priority?: ProjectPriority
  startDate?: string
  endDate?: string
  projectOwnerId?: string
}

export interface ProjectFilters {
  status?: ProjectStatus
  priority?: ProjectPriority
  clientId?: string
  search?: string
  sortBy?: 'name' | 'deadline' | 'updatedAt'
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  companyId: string
  roleInProject?: string
  // Populated user data
  userName?: string
  userEmail?: string
  userRole?: string
}

export interface AddProjectMemberRequest {
  userId: string
  roleInProject?: string
}

// Service
export const projectService = {
  async getProjects(filters?: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.clientId) params.append('clientId', filters.clientId)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    
    const queryString = params.toString()
    const response = await apiClient.get<Project[]>(`/projects${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  async getProject(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`)
    return response.data
  },

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data)
    return response.data
  },

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, data)
    return response.data
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`)
  },

  // Project Members (optional - if backend supports)
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`)
    return response.data
  },

  async addProjectMember(projectId: string, data: AddProjectMemberRequest): Promise<ProjectMember> {
    const response = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data)
    return response.data
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`)
  },
}
