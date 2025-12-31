import { apiClient } from '@/lib/api'
import type { Invoice, InvoiceFilters, CreateInvoiceRequest, UpdateInvoiceRequest } from '@/types/invoice'

export type { Invoice, InvoiceFilters, CreateInvoiceRequest, UpdateInvoiceRequest }

export const invoiceService = {
  async getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
    const params = new URLSearchParams();
    
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fromIssueDate) params.append('fromIssueDate', filters.fromIssueDate);
    if (filters?.toIssueDate) params.append('toIssueDate', filters.toIssueDate);
    if (filters?.overdueOnly !== undefined) params.append('overdueOnly', String(filters.overdueOnly));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString();
    const url = `/invoices${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get<Invoice[]>(url);
    return response.data;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  async createInvoice(payload: CreateInvoiceRequest): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/invoices', payload);
    return response.data;
  },

  async updateInvoice(id: string, payload: UpdateInvoiceRequest): Promise<Invoice> {
    const response = await apiClient.put<Invoice>(`/invoices/${id}`, payload);
    return response.data;
  },

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const response = await apiClient.patch<Invoice>(
      `/invoices/${id}/status`,
      { status }
    );
    return response.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(`/invoices/${id}`);
  },
}

