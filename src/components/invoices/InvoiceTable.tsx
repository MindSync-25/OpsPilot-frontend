import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Eye,
  Send,
  CheckCheck,
  XCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { invoiceService } from '@/services/invoiceService';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceDetailDrawer } from './InvoiceDetailDrawer';
import { GenerateInvoiceFromTimeDialog } from './GenerateInvoiceFromTimeDialog';
import type { Invoice } from '@/types/invoice';

interface InvoiceTableProps {
  projectId?: string;
  hideProjectColumn?: boolean;
  showCreateButton?: boolean;
  showGenerateFromTimeButton?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'SENT':
      return 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]';
    case 'PAID':
      return 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function InvoiceTable({
  projectId,
  hideProjectColumn = false,
  showCreateButton = true,
  showGenerateFromTimeButton = false,
}: InvoiceTableProps) {
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [showGenerateFromTime, setShowGenerateFromTime] = useState(false);

  // Fetch data
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices', { projectId }],
    queryFn: () => invoiceService.getInvoices(projectId ? { projectId } : {}),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });

  // Create lookup maps
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients]
  );

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  // Mutations
  const createMutation = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCreateForm(false);
      toast.success('Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoiceService.updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteInvoiceId(null);
      toast.success('Invoice deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    },
  });

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    await updateStatusMutation.mutateAsync({ id: invoiceId, status });
  };

  const handleDelete = async (invoiceId: string) => {
    await deleteMutation.mutateAsync(invoiceId);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailDrawer(true);
  };

  if (isLoadingInvoices) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-gray-500">
            {projectId
              ? 'No invoices for this project yet.'
              : 'No invoices found'}
          </p>
          {showCreateButton && (
            <Button
              variant="link"
              onClick={() => setShowCreateForm(true)}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create your first invoice
            </Button>
          )}
        </div>

        <InvoiceForm
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          isLoading={createMutation.isPending}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {(showCreateButton || showGenerateFromTimeButton) && (
          <div className="flex justify-end gap-2">
            {showGenerateFromTimeButton && (
              <Button onClick={() => setShowGenerateFromTime(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Generate from Time
              </Button>
            )}
            {showCreateButton && (
              <Button onClick={() => setShowCreateForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              {!hideProjectColumn && <TableHead>Project</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{clientMap.get(invoice.clientId)}</TableCell>
                {!hideProjectColumn && (
                  <TableCell>
                    {invoice.projectId
                      ? projectMap.get(invoice.projectId)
                      : '-'}
                  </TableCell>
                )}
                <TableCell>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                  {invoice.isOverdue && (
                    <span className="ml-2 text-red-500 text-xs">
                      Overdue
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  {invoice.dueDate
                    ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                    : '-'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${invoice.total.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {invoice.status === 'DRAFT' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleUpdateStatus(invoice.id, 'SENT')
                        }
                        title="Mark as Sent"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    {(invoice.status === 'SENT' ||
                      invoice.status === 'OVERDUE') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleUpdateStatus(invoice.id, 'PAID')
                        }
                        title="Mark as Paid"
                      >
                        <CheckCheck className="w-4 h-4 text-[var(--accent-success)]" />
                      </Button>
                    )}
                    {(invoice.status === 'DRAFT' ||
                      invoice.status === 'SENT') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleUpdateStatus(invoice.id, 'CANCELLED')
                        }
                        title="Cancel Invoice"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {invoice.status !== 'PAID' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteInvoiceId(invoice.id)}
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Invoice Form */}
      <InvoiceForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isLoading={createMutation.isPending}
      />

      {/* Invoice Detail Drawer */}
      <InvoiceDetailDrawer
        invoiceId={selectedInvoice?.id || null}
        open={showDetailDrawer}
        onOpenChange={setShowDetailDrawer}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteInvoiceId}
        onOpenChange={() => setDeleteInvoiceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInvoiceId && handleDelete(deleteInvoiceId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Invoice from Time Dialog */}
      <GenerateInvoiceFromTimeDialog
        open={showGenerateFromTime}
        onOpenChange={setShowGenerateFromTime}
      />
    </>
  );
}
