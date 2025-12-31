export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  clientId: string;
  projectId?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  items: InvoiceItem[];
}

export interface CreateInvoiceRequest {
  clientId: string;
  projectId?: string;
  issueDate: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateInvoiceRequest {
  clientId?: string;
  projectId?: string;
  issueDate?: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface InvoiceFilters {
  clientId?: string;
  projectId?: string;
  status?: InvoiceStatus;
  fromIssueDate?: string;
  toIssueDate?: string;
  overdueOnly?: boolean;
  sortBy?: 'issueDate_asc' | 'issueDate_desc' | 'dueDate_asc' | 'dueDate_desc' | 'total_asc' | 'total_desc';
}
