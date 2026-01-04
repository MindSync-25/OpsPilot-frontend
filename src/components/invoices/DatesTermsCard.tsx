import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Invoice } from '@/types/invoice';

interface DatesTermsCardProps {
  invoice: Invoice;
}

export function DatesTermsCard({ invoice }: DatesTermsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dates & Terms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Issue Date</div>
            <div className="font-medium">{format(new Date(invoice.issueDate), 'PP')}</div>
          </div>
          {invoice.dueDate && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Due Date</div>
              <div className="font-medium">{format(new Date(invoice.dueDate), 'PP')}</div>
            </div>
          )}
          {invoice.paymentTerms && (
            <div>
              <div className="text-sm text-muted-foreground mb-1">Payment Terms</div>
              <div className="font-medium">{invoice.paymentTerms}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-muted-foreground mb-1">Currency / Tax</div>
            <div className="font-medium">
              {invoice.currencyCode || 'USD'} / {invoice.taxRate}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
