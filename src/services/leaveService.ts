import { apiClient as api } from '@/lib/api';

export type LeaveType = 'PTO' | 'SICK' | 'HOLIDAY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveResponse {
  id: string;
  companyId: string;
  userId: string;
  userName?: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  type: LeaveType;
  status: LeaveStatus;
  reason?: string;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  startDate: string;
  endDate: string;
  type: LeaveType;
  reason?: string;
}

export interface LeaveFilters {
  status?: string;
  fromDate?: string;
  toDate?: string;
  userId?: string;
}

export interface UpdateLeaveStatusRequest {
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  decisionNote?: string;
}

/**
 * Get the current user's leave requests
 */
export const getMyLeaveRequests = async (): Promise<LeaveResponse[]> => {
  const response = await api.get<LeaveResponse[]>('/leave/me');
  return response.data;
};

/**
 * Create a new leave request for the current user
 */
export const createMyLeaveRequest = async (payload: CreateLeaveRequest): Promise<LeaveResponse> => {
  const response = await api.post<LeaveResponse>('/leave/me', payload);
  return response.data;
};

/**
 * List leave requests (for managers/approvers)
 * Backend enforces role-based scoping
 */
export const listLeaveRequests = async (filters?: LeaveFilters): Promise<LeaveResponse[]> => {
  const response = await api.get<LeaveResponse[]>('/leave', {
    params: filters
  });
  return response.data;
};

/**
 * Update leave request status (approve/reject/cancel)
 */
export const updateLeaveStatus = async (
  id: string,
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
  decisionNote?: string
): Promise<LeaveResponse> => {
  const response = await api.patch<LeaveResponse>(`/leave/${id}/status`, {
    status,
    rejectionReason: decisionNote // Backend uses rejectionReason field
  });
  return response.data;
};
