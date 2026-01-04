import { format } from 'date-fns';
import { FileText, Send, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Invoice } from '@/types/invoice';

interface ActivityTimelineProps {
  invoice: Invoice;
}

export function ActivityTimeline({ invoice }: ActivityTimelineProps) {
  // Only show if we have activity beyond creation
  const hasActivity = invoice.sentAt || invoice.paidAt || invoice.cancelledAt;

  if (!hasActivity) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 pt-1">
              <div className="text-sm font-medium">Created</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(invoice.createdAt), 'PPp')}
              </div>
            </div>
          </div>

          {invoice.sentAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                <Send className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-1">
                <div className="text-sm font-medium">Sent</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(invoice.sentAt), 'PPp')}
                </div>
              </div>
            </div>
          )}

          {invoice.paidAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/20 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-1">
                <div className="text-sm font-medium">Paid</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(invoice.paidAt), 'PPp')}
                </div>
              </div>
            </div>
          )}

          {invoice.cancelledAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <XCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-1">
                <div className="text-sm font-medium">Cancelled</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(invoice.cancelledAt), 'PPp')}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
