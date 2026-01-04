import { useState } from 'react';
import { Send, CheckCircle2, FileDown, Edit, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ActionsPanelProps {
  invoice: Invoice;
  onUpdateStatus: (invoiceId: string, status: string) => void;
  onDelete: (invoiceId: string) => void;
}

export function ActionsPanel({ invoice, onUpdateStatus, onDelete }: ActionsPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await apiClient.get(`/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const canSend = invoice.status === 'DRAFT';
  const canMarkPaid = invoice.status === 'SENT' || invoice.status === 'OVERDUE';
  const canCancel = invoice.status === 'DRAFT' || invoice.status === 'SENT';
  const canDelete = invoice.status !== 'PAID';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Draft Actions */}
          {canSend && (
            <>
              <Button
                className="w-full gap-2"
                onClick={() => handleUpdateStatus('SENT')}
                disabled={actionLoading}
              >
                <Send className="w-4 h-4" />
                Send Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                disabled
              >
                <Edit className="w-4 h-4" />
                Edit Invoice
              </Button>
            </>
          )}

          {/* Sent Actions */}
          {canMarkPaid && (
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => setShowMarkPaidDialog(true)}
              disabled={actionLoading}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark as Paid
            </Button>
          )}

          {/* Paid Actions */}
          {invoice.status === 'PAID' && (
            <Button
              className="w-full gap-2"
              onClick={handleDownloadPDF}
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </Button>
          )}

          {/* Common Actions */}
          {invoice.status !== 'PAID' && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleDownloadPDF}
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowCancelDialog(true)}
              disabled={actionLoading}
            >
              <XCircle className="w-4 h-4" />
              Cancel Invoice
            </Button>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => setShowDeleteDialog(true)}
              disabled={actionLoading}
            >
              <Trash2 className="w-4 h-4" />
              Delete Invoice
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Mark Paid Confirmation */}
      <AlertDialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark invoice {invoice.invoiceNumber} as paid?
              This action will update the invoice status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleUpdateStatus('PAID');
                setShowMarkPaidDialog(false);
              }}
            >
              Yes, mark as paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel invoice {invoice.invoiceNumber}? 
              This will mark the invoice as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await handleUpdateStatus('CANCELLED');
                setShowCancelDialog(false);
              }}
            >
              Yes, cancel invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoice.invoiceNumber}? 
              This action cannot be undone.
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
