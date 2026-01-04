import { useState } from 'react';
import { format } from 'date-fns';
import { X, Calendar, DollarSign, FileText, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import type { Invoice } from '@/types/invoice';

interface InvoiceDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onUpdateStatus: (invoiceId: string, status: string) => void;
  onDelete: (invoiceId: string) => void;
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

export function InvoiceDetailDrawer({
  open,
  onClose,
  invoice,
  onUpdateStatus,
  onDelete,
}: InvoiceDetailDrawerProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!invoice) return null;

  const handleUpdateStatus = async (status: string) => {
    setActionLoading(true);
    try {
      await onUpdateStatus(invoice.id, status);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await onDelete(invoice.id);
      setShowDeleteDialog(false);
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const canMarkSent = invoice.status === 'DRAFT';
  const canMarkPaid = invoice.status === 'SENT' || invoice.status === 'OVERDUE';
  const canCancel = invoice.status === 'DRAFT' || invoice.status === 'SENT';
  const canDelete = invoice.status !== 'PAID';

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Invoice Details</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{invoice.invoiceNumber}</h3>
                  <p className="text-sm text-gray-500">
                    Created {format(new Date(invoice.createdAt), 'PPP')}
                  </p>
                </div>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>

              {invoice.isOverdue && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                    ⚠️ This invoice is overdue
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Dates Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" />
                  Issue Date
                </div>
                <p className="font-medium">
                  {format(new Date(invoice.issueDate), 'PPP')}
                </p>
              </div>
              {invoice.dueDate && (
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    Due Date
                  </div>
                  <p className="font-medium">
                    {format(new Date(invoice.dueDate), 'PPP')}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Invoice Items */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium w-16">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium w-24">
                        Price
                      </th>
                      <th className="px-4 py-2 text-right text-sm font-medium w-28">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          ${(item.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({invoice.taxRate}%):</span>
                <span className="font-medium">${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="flex items-center">
                  <DollarSign className="w-5 h-5" />
                  {invoice.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="w-4 h-4 mr-2" />
                    Notes
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <h4 className="font-semibold">Actions</h4>
              <div className="flex flex-wrap gap-2">
                {canMarkSent && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('SENT')}
                    disabled={actionLoading}
                  >
                    Mark as Sent
                  </Button>
                )}
                {canMarkPaid && (
                  <Button
                    variant="default"
                    onClick={() => handleUpdateStatus('PAID')}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Paid
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    disabled={actionLoading}
                  >
                    Cancel Invoice
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={actionLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Invoice
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoice.invoiceNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
