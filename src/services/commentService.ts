import { apiClient } from '@/lib/api'

export type EntityType = 'PHASE' | 'TASK' | 'SUBTASK'

export interface Comment {
  id: string
  entityType: EntityType
  entityId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommentRequest {
  content: string
}

class CommentService {
  // Get comments for a phase
  async getPhaseComments(phaseId: string): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(`/comments/phases/${phaseId}`)
    return response.data
  }

  // Create comment for a phase
  async createPhaseComment(phaseId: string, data: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post<Comment>(`/comments/phases/${phaseId}`, data)
    return response.data
  }

  // Get comments for a task
  async getTaskComments(taskId: string): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(`/comments/tasks/${taskId}`)
    return response.data
  }

  // Create comment for a task
  async createTaskComment(taskId: string, data: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post<Comment>(`/comments/tasks/${taskId}`, data)
    return response.data
  }

  // Get comments for a subtask
  async getSubtaskComments(subtaskId: string): Promise<Comment[]> {
    const response = await apiClient.get<Comment[]>(`/comments/subtasks/${subtaskId}`)
    return response.data
  }

  // Create comment for a subtask
  async createSubtaskComment(subtaskId: string, data: CreateCommentRequest): Promise<Comment> {
    const response = await apiClient.post<Comment>(`/comments/subtasks/${subtaskId}`, data)
    return response.data
  }
}

export const commentService = new CommentService()
