import { apiClient } from '@/lib/api'

export interface Client {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: string | null
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientRequest {
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  status?: string
}

export interface UpdateClientRequest {
  name?: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  status?: string
}

export const clientService = {
  async getClients(): Promise<Client[]> {
    const response = await apiClient.get<Client[]>('/clients')
    return response.data
  },

  async getClient(id: string): Promise<Client> {
    const response = await apiClient.get<Client>(`/clients/${id}`)
    return response.data
  },

  async createClient(data: CreateClientRequest): Promise<Client> {
    const response = await apiClient.post<Client>('/clients', data)
    return response.data
  },

  async updateClient(id: string, data: UpdateClientRequest): Promise<Client> {
    const response = await apiClient.put<Client>(`/clients/${id}`, data)
    return response.data
  },

  async deleteClient(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`)
  },
}
