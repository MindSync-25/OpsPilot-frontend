import { apiClient } from '@/lib/api'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  projectId: string | null
  phaseId: string | null
  assignedTo: string | null
  dueDate: string | null
  storyPoints: string | null
  createdBy: string | null
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  projectId: string  // Required field
  phaseId?: string
  assignedTo?: string
  dueDate?: string
  storyPoints?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  projectId?: string
  phaseId?: string
  assignedTo?: string
  dueDate?: string
  storyPoints?: string
}

export const taskService = {
  async getTasks(projectId?: string, phaseId?: string): Promise<Task[]> {
    let url = '/tasks'
    const params = new URLSearchParams()
    if (projectId) params.append('projectId', projectId)
    if (phaseId) params.append('phaseId', phaseId)
    if (params.toString()) url += `?${params.toString()}`
    
    const response = await apiClient.get<Task[]>(url)
    return response.data
  },

  async getTask(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`)
    return response.data
  },

  async createTask(data: CreateTaskRequest): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', data)
    return response.data
  },

  async updateTask(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data)
    return response.data
  },

  async patchTask(id: string, data: Partial<UpdateTaskRequest>): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}`, data)
    return response.data
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, { status })
    return response.data
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`)
  },
}
