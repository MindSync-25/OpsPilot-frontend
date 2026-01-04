import { apiClient } from '@/lib/api';

// ========================================================
// TYPES
// ========================================================

export interface InvoiceGenerationPreviewRequest {
  clientId: string;
  projectId?: string;
  fromDate: string; // ISO date format YYYY-MM-DD
  toDate: string;
  billableOnly?: boolean; // default true
  groupBy?: 'USER' | 'TASK'; // default USER
  includeDescriptions?: boolean;
}

export interface PreviewLineItem {
  description: string;
  quantityMinutes: number;
  quantityHours: number;
  unitPrice: number;
  amount: number;
  userId?: string;
  userName?: string;
  taskId?: string;
  taskTitle?: string;
  aggregatedNotes?: string;
}

export interface MissingRateUser {
  userId: string;
  name: string;
  email: string;
  message: string;
}

export interface InvoiceGenerationPreviewResponse {
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  fromDate: string;
  toDate: string;
  totalMinutes: number;
  totalHours: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  lineItems: PreviewLineItem[];
  missingRates: MissingRateUser[];
  entriesCount: number;
  canGenerate: boolean;
  message?: string;
}

export interface InvoiceGenerateRequest extends InvoiceGenerationPreviewRequest {
  taxRate?: number; // override default 18%
  notes?: string;
  confirmed: boolean; // must be true
}

export interface InvoiceGenerateResponse {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  billedEntriesCount: number;
  message: string;
}

// ========================================================
// API FUNCTIONS
// ========================================================

export const invoiceGenerationService = {
  /**
   * Preview invoice generation from time entries
   * Shows what the invoice would contain before generating
   */
  previewFromTime: async (
    payload: InvoiceGenerationPreviewRequest
  ): Promise<InvoiceGenerationPreviewResponse> => {
    const response = await apiClient.post<InvoiceGenerationPreviewResponse>(
      '/invoices/generation/preview',
      payload
    );
    return response.data;
  },

  /**
   * Generate DRAFT invoice from time entries
   * Creates actual invoice and links time entries
   */
  generateFromTime: async (
    payload: InvoiceGenerateRequest
  ): Promise<InvoiceGenerateResponse> => {
    const response = await apiClient.post<InvoiceGenerateResponse>(
      '/invoices/generation/generate',
      payload
    );
    return response.data;
  },
};
