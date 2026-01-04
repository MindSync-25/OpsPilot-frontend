import type { CreateClientRequest } from './clientService'
import { apiClient } from '@/lib/api'

export interface UpdateCrmClientRequest {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  leadStage?: string;
  notes?: string;
  nextFollowUp?: string;
  ownerId?: string;
}

export interface CrmClient {
  id: string
  clientId: string
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  status?: string | null
  leadStage: string
  notes?: string | null
  nextFollowUp?: string | null
  ownerId?: string | null
  ownerName?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export const crmService = {
    async updateCrmClient(crmId: string, data: UpdateCrmClientRequest): Promise<CrmClient> {
      const response = await apiClient.put(`/crm/${crmId}`, data);
      const item = response.data;
      return {
        id: item.id,
        clientId: item.clientId,
        name: item.name,
        contactName: item.contactName || null,
        email: item.email || null,
        phone: item.phone || null,
        address: item.address || null,
        status: item.status || null,
        leadStage: item.leadStage,
        notes: item.notes || null,
        nextFollowUp: item.nextFollowUp || null,
        ownerName: item.ownerName || null,
        createdAt: item.createdAt || null,
        updatedAt: item.updatedAt || null,
      };
    },
  async getAllCrmClients(): Promise<CrmClient[]> {
    const response = await apiClient.get('/crm')
    return response.data.map((item: any) => ({
      id: item.id,
      clientId: item.clientId,
      name: item.name,
      contactName: item.contactName || null,
      email: item.email || null,
      phone: item.phone || null,
      address: item.address || null,
      status: item.status || null,
      leadStage: item.leadStage,
      notes: item.notes || null,
      nextFollowUp: item.nextFollowUp || null,
      ownerName: item.ownerName || null,
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    }))
  },
  async createLead(data: CreateClientRequest): Promise<CrmClient> {
    const response = await apiClient.post('/crm/clients', data)
    const item = response.data
    return {
      id: item.id,
      clientId: item.clientId,
      name: item.name,
      contactName: item.contactName || null,
      email: item.email || null,
      phone: item.phone || null,
      address: item.address || null,
      status: item.status || null,
      leadStage: item.leadStage,
      notes: item.notes || null,
      nextFollowUp: item.nextFollowUp || null,
      ownerName: item.ownerName || null,
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    }
  },
}
