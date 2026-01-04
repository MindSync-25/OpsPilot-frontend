import { apiClient } from '@/lib/api'

export interface TimeEntry {
  id: string
  userId: string
  userName?: string
  projectId: string
  projectName?: string
  taskId?: string
  taskName?: string
  date: string
  hours: number
  description?: string
  isBillable: boolean
  startTime?: string
  endTime?: string
  isActive?: boolean
  durationMinutes?: number
  createdAt: string
}

export interface StartTimerRequest {
  projectId: string
  taskId?: string
  isBillable?: boolean
  notes?: string
}

export interface CreateManualTimeEntryRequest {
  projectId: string
  taskId?: string
  date: string
  hours: number
  isBillable?: boolean
  notes?: string
}

export interface UpdateTimeEntryRequest {
  projectId?: string
  taskId?: string
  date?: string
  hours?: number
  isBillable?: boolean
  notes?: string
}

export interface TimeEntryFilters {
  projectId?: string
  userId?: string
  fromDate?: string
  toDate?: string
  billable?: boolean
}

export const timeEntryService = {
  async getTimeEntries(filters?: TimeEntryFilters): Promise<TimeEntry[]> {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.userId) params.append('userId', filters.userId)
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)
    if (filters?.billable !== undefined) params.append('billable', String(filters.billable))
    
    const queryString = params.toString()
    const url = `/time-entries${queryString ? `?${queryString}` : ''}`
    const response = await apiClient.get<TimeEntry[]>(url)
    return response.data
  },

  async getActiveTimer(): Promise<TimeEntry | null> {
    try {
      const response = await apiClient.get<TimeEntry>('/time-entries/active')
      return response.data
    } catch (error: any) {
      if (error.response?.status === 204) {
        return null
      }
      throw error
    }
  },

  async startTimer(payload: StartTimerRequest): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time-entries/start', payload)
    return response.data
  },

  async stopTimer(): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time-entries/stop')
    return response.data
  },

  async createManualEntry(payload: CreateManualTimeEntryRequest): Promise<TimeEntry> {
    const response = await apiClient.post<TimeEntry>('/time-entries/manual', payload)
    return response.data
  },

  async updateEntry(id: string, payload: UpdateTimeEntryRequest): Promise<TimeEntry> {
    const response = await apiClient.put<TimeEntry>(`/time-entries/${id}`, payload)
    return response.data
  },

  async deleteEntry(id: string): Promise<void> {
    await apiClient.delete(`/time-entries/${id}`)
  },
}

// Export individual functions for easier imports
export const getTimeEntries = timeEntryService.getTimeEntries
export const getActiveTimer = timeEntryService.getActiveTimer
export const startTimer = timeEntryService.startTimer
export const stopTimer = timeEntryService.stopTimer
export const createManualEntry = timeEntryService.createManualEntry
export const updateEntry = timeEntryService.updateEntry
export const deleteEntry = timeEntryService.deleteEntry
