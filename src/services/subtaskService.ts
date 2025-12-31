import { apiClient } from '@/lib/api';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  dueDate?: string;
  storyPoints?: string;
  createdBy?: string;
  parentSubtaskId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskRequest {
  title: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  dueDate?: string;
  storyPoints?: string;
  parentSubtaskId?: string;
  sortOrder?: number;
}

export interface UpdateSubtaskRequest {
  title?: string;
  description?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignedTo?: string;
  dueDate?: string;
  storyPoints?: string;
  sortOrder?: number;
}

export const subtaskService = {
  getSubtasks: async (taskId: string): Promise<Subtask[]> => {
    const response = await apiClient.get<Subtask[]>(`/tasks/${taskId}/subtasks`);
    return response.data;
  },

  getSubtaskById: async (taskId: string, subtaskId: string): Promise<Subtask> => {
    const response = await apiClient.get<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`);
    return response.data;
  },

  createSubtask: async (taskId: string, data: CreateSubtaskRequest): Promise<Subtask> => {
    const response = await apiClient.post<Subtask>(`/tasks/${taskId}/subtasks`, data);
    return response.data;
  },

  updateSubtask: async (
    taskId: string,
    subtaskId: string,
    data: UpdateSubtaskRequest
  ): Promise<Subtask> => {
    const response = await apiClient.put<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
    return response.data;
  },

  deleteSubtask: async (taskId: string, subtaskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  },
};
