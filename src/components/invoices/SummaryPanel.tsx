import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Invoice } from '@/types/invoice';
import { formatCurrency, daysUntil } from '@/lib/utils';

interface SummaryPanelProps {
  invoice: Invoice;
}

export function SummaryPanel({ invoice }: SummaryPanelProps) {
  const currencyCode = invoice.currencyCode || 'USD';
  const amountDue = invoice.status === 'PAID' ? 0 : invoice.total;
  const daysRemaining = invoice.dueDate ? daysUntil(invoice.dueDate) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Due */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">Amount Due</div>
          <div className="text-3xl font-bold flex items-center gap-1">
            <DollarSign className="w-6 h-6" />
            {formatCurrency(amountDue, currencyCode).replace(/[^0-9,.]/g, '')}
          </div>
        </div>

        {/* Due Date Info */}
        {invoice.dueDate && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Due Date</div>
            <div className="font-medium">{format(new Date(invoice.dueDate), 'PP')}</div>
            {invoice.status !== 'PAID' && daysRemaining !== null && (
              <div className={`text-sm mt-1 ${
                daysRemaining < 0 
                  ? 'text-red-600 dark:text-red-400'
                  : daysRemaining <= 7
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-muted-foreground'
              }`}>
                {daysRemaining < 0 
                  ? `Overdue by ${Math.abs(daysRemaining)} days`
                  : daysRemaining === 0
                  ? 'Due today'
                  : `Due in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="font-medium">{invoice.status}</div>
          {invoice.status === 'PAID' && invoice.paidAt && (
            <div className="text-sm text-muted-foreground mt-1">
              Paid on {format(new Date(invoice.paidAt), 'PP')}
            </div>
          )}
        </div>

        <Separator />

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(invoice.subtotal, currencyCode)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
            <span className="font-medium">{formatCurrency(invoice.taxAmount, currencyCode)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total, currencyCode)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
