import { apiClient as api } from '@/lib/api';

export interface DailyBreakdown {
  date: string;
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
}

export interface TimesheetResponse {
  id: string;
  companyId: string;
  userId: string;
  userName?: string;
  weekStart: string; // ISO date
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  totalMinutes: number;
  billableMinutes: number;
  nonBillableMinutes: number;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  dailyBreakdown?: DailyBreakdown[];
  projectBreakdown?: ProjectBreakdown[];
}

export interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  totalMinutes: number;
  billableMinutes: number;
}

export interface TimesheetFilters {
  weekStart?: string;
  status?: string;
  userId?: string;
}

export interface SubmitTimesheetRequest {
  weekStart: string;
}

export interface ReviewTimesheetRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

/**
 * Get or create the user's timesheet for a specific week
 */
export const getMyTimesheet = async (weekStart: string): Promise<TimesheetResponse> => {
  const response = await api.get<TimesheetResponse>(`/timesheets/me`, {
    params: { weekStart }
  });
  return response.data;
};

/**
 * Submit the user's timesheet for approval
 */
export const submitMyTimesheet = async (weekStart: string): Promise<TimesheetResponse> => {
  const response = await api.post<TimesheetResponse>('/timesheets/me/submit', {
    weekStart
  });
  return response.data;
};

/**
 * List timesheets (for managers/approvers)
 * Backend enforces role-based scoping
 */
export const listTimesheets = async (filters?: TimesheetFilters): Promise<TimesheetResponse[]> => {
  const response = await api.get<TimesheetResponse[]>('/timesheets', {
    params: filters
  });
  return response.data;
};

/**
 * Get a specific timesheet by ID
 */
export const getTimesheetById = async (id: string): Promise<TimesheetResponse> => {
  const response = await api.get<TimesheetResponse>(`/timesheets/${id}`);
  return response.data;
};

/**
 * Approve or reject a timesheet
 */
export const reviewTimesheet = async (
  id: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string
): Promise<TimesheetResponse> => {
  const response = await api.patch<TimesheetResponse>(`/timesheets/${id}/review`, {
    status,
    rejectionReason
  });
  return response.data;
};
