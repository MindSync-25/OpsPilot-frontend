import { apiClient } from '@/lib/api'

export interface Team {
  id: string
  name: string
  leadUserId?: string
  createdByUserId?: string
  createdAt?: string
  updatedAt?: string
}

export interface TeamWithMembers extends Team {
  members: Array<{
    id: string
    name: string
    email: string
    role: string
    designation?: string
  }>
}

export interface CreateTeamRequest {
  name: string
  leadUserId?: string
}

export const teamService = {
  async getTeams(): Promise<Team[]> {
    const response = await apiClient.get('/teams')
    return response.data
  },

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await apiClient.post('/teams', data)
    return response.data
  },

  async updateTeam(id: string, data: Partial<CreateTeamRequest>): Promise<Team> {
    console.log('teamService.updateTeam called with:', { id, data })
    const response = await apiClient.put(`/teams/${id}`, data)
    console.log('teamService.updateTeam response:', response.data)
    return response.data
  },

  async deleteTeam(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`)
  },
}
