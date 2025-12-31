import { apiClient } from '@/lib/api'

export interface User {
  id: string
  name: string
  email: string
  role: string
  teamId?: string | null
  designation?: string
  isActive?: boolean
  status?: string
  createdAt?: string
  updatedAt?: string
  companyId?: string
  createdByUserId?: string
  managerUserId?: string
}

export interface CreateUserRequest {
  name: string
  email: string
  role: string
  teamId?: string
  designation?: string
  managerUserId?: string
  password?: string
}

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users')
    return response.data
  },

  async getUsersForAssignment(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users/all-for-assignment')
    return response.data
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>('/users', data)
    return response.data
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data)
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  },
}
