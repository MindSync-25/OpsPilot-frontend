import { apiClient } from '@/lib/api'

export interface ProjectMember {
  id: string
  userId: string
  userName: string
  userEmail: string
  userDesignation?: string
  userRole: string  // Company role
  roleInProject?: string  // Project-specific role
  createdAt: string
}

export interface AddProjectMemberRequest {
  userId: string
  roleInProject?: string
}

class ProjectMemberService {
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`)
    return response.data
  }

  async addProjectMember(projectId: string, data: AddProjectMemberRequest): Promise<ProjectMember> {
    const response = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, data)
    return response.data
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`)
  }
  
  async syncMembersFromTasks(projectId: string): Promise<string> {
    const response = await apiClient.post<string>(`/projects/${projectId}/members/sync`)
    return response.data
  }
}

export const projectMemberService = new ProjectMemberService()
