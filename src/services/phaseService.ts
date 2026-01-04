import { apiClient } from '@/lib/api';

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: 'TODO' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  teamId?: string;
  teamName?: string;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhaseRequest {
  name: string;
  description?: string;
  sortOrder?: number;
  status?: 'TODO' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  teamId?: string;
}

export interface UpdatePhaseRequest {
  name?: string;
  description?: string;
  sortOrder?: number;
  status?: 'TODO' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  teamId?: string;
}

export const phaseService = {
  getPhases: async (projectId: string): Promise<Phase[]> => {
    const response = await apiClient.get<Phase[]>(`/projects/${projectId}/phases`);
    return response.data;
  },

  getPhaseById: async (projectId: string, phaseId: string): Promise<Phase> => {
    const response = await apiClient.get<Phase>(`/projects/${projectId}/phases/${phaseId}`);
    return response.data;
  },

  createPhase: async (projectId: string, data: CreatePhaseRequest): Promise<Phase> => {
    const response = await apiClient.post<Phase>(`/projects/${projectId}/phases`, data);
    return response.data;
  },

  updatePhase: async (
    projectId: string,
    phaseId: string,
    data: UpdatePhaseRequest
  ): Promise<Phase> => {
    const response = await apiClient.put<Phase>(`/projects/${projectId}/phases/${phaseId}`, data);
    return response.data;
  },

  deletePhase: async (projectId: string, phaseId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/phases/${phaseId}`);
  },
};
