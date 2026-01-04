export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceUserInfo {
  id: string;
  name: string;
  email: string;
}

export interface InvoiceTaskInfo {
  id: string;
  title: string;
}

export interface InvoiceClientInfo {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoiceProjectInfo {
  id: string;
  name: string;
  status: string;
}

export interface InvoiceSummary {
  totalMinutes?: number;
  totalBillableMinutes?: number;
  entryCount?: number;
  contributorsCount?: number;
  tasksCount?: number;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  itemType?: string;
  user?: InvoiceUserInfo;
  task?: InvoiceTaskInfo;
  rate?: number;
  minutes?: number;
  sourceTimeEntryIds?: string[];
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
  client?: InvoiceClientInfo;
  project?: InvoiceProjectInfo;
  createdBy?: InvoiceUserInfo;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  currencyCode?: string;
  paymentTerms?: string;
  sentAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  summary?: InvoiceSummary;
}

export interface CreateInvoiceRequest {
  clientId: string;
  projectId?: string;
  issueDate: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  currencyCode?: string;
  paymentTerms?: string;
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
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  currencyCode?: string;
  paymentTerms?: string;
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
