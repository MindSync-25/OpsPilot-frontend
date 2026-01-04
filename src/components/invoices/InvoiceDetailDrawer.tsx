import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api';
import type { Invoice } from '@/types/invoice';
import { InvoiceHeader } from './InvoiceHeader';
import { ClientProjectCard } from './ClientProjectCard';
import { DatesTermsCard } from './DatesTermsCard';
import { BillingContextCard } from './BillingContextCard';
import { LineItemsTable } from './LineItemsTable';
import { NotesCard } from './NotesCard';
import { ActivityTimeline } from './ActivityTimeline';
import { SummaryPanel } from './SummaryPanel';
import { ActionsPanel } from './ActionsPanel';

interface InvoiceDetailDrawerProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailDrawer({
  invoiceId,
  open,
  onOpenChange,
}: InvoiceDetailDrawerProps) {
  const queryClient = useQueryClient();

  // Fetch invoice details
  const { data: invoice, isLoading, isError, error } = useQuery<Invoice>({
    queryKey: ['invoices', invoiceId],
    queryFn: async () => {
      const response = await apiClient.get(`/invoices/${invoiceId}`);
      return response.data;
    },
    enabled: !!invoiceId && open,
  });

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiClient.put(`/invoices/${id}/status?status=${status}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update invoice status');
    },
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onOpenChange(false);
      toast.success('Invoice deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete invoice');
    },
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-[95vw] !max-w-[1400px] overflow-y-auto !left-[50%] !translate-x-[-50%] sm:!max-w-[1400px]">
        {isLoading || (!invoice && !isError) ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <p className="text-lg font-semibold text-destructive">Failed to load invoice</p>
            <p className="text-sm text-muted-foreground">{error?.message || 'An error occurred'}</p>
          </div>
        ) : invoice ? (
          <div className="space-y-6 pb-6">
            {/* Header (Full Width) */}
            <InvoiceHeader invoice={invoice} onClose={() => onOpenChange(false)} />

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COLUMN (Main Content - 2/3) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Client & Project Context */}
                <ClientProjectCard invoice={invoice} />

                {/* Dates & Terms */}
                <DatesTermsCard invoice={invoice} />

                {/* Billing Context (conditional) */}
                <BillingContextCard invoice={invoice} />

                {/* Line Items */}
                <LineItemsTable invoice={invoice} />

                {/* Notes */}
                <NotesCard invoice={invoice} />

                {/* Activity Timeline (conditional) */}
                <ActivityTimeline invoice={invoice} />
              </div>

              {/* RIGHT COLUMN (Summary & Actions - 1/3) */}
              <div className="space-y-4">
                {/* Summary Panel */}
                <SummaryPanel invoice={invoice} />

                {/* Actions Panel */}
                <ActionsPanel
                  invoice={invoice}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
