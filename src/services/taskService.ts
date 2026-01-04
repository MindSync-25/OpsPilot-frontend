import { apiClient } from '@/lib/api'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  projectId: string | null
  projectName?: string | null
  phaseId: string | null
  phaseName?: string | null
  assignedTo: string | null
  assigneeName?: string | null
  assigneeEmail?: string | null
  teamId?: string | null
  dueDate: string | null
  storyPoints: string | null
  createdBy: string | null
  creatorName?: string | null
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
  teamId?: string
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
  teamId?: string
  assignedTo?: string
  dueDate?: string
  storyPoints?: string
}

export const taskService = {
  async getTasks(filters?: { 
    projectId?: string
    phaseId?: string
    teamId?: string
    assignedTo?: string
    status?: TaskStatus
    createdBy?: string
  }): Promise<Task[]> {
    let url = '/tasks'
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.phaseId) params.append('phaseId', filters.phaseId)
    if (filters?.teamId) params.append('teamId', filters.teamId)
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.createdBy) params.append('createdBy', filters.createdBy)
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
    const response = await apiClient.patch<Task>(`/tasks/${id}`, { status })
    return response.data
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`)
  },
}
