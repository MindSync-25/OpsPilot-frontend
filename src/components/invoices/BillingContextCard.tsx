import { format } from 'date-fns';
import { Clock, Users, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Invoice } from '@/types/invoice';

interface BillingContextCardProps {
  invoice: Invoice;
}

export function BillingContextCard({ invoice }: BillingContextCardProps) {
  const { billingPeriodStart, billingPeriodEnd, summary } = invoice;

  // Only show if we have any billing context data
  if (!billingPeriodStart && !summary?.entryCount && !summary?.contributorsCount && !summary?.tasksCount) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Billing Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {billingPeriodStart && billingPeriodEnd && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Billing Period</span>
            <span className="font-medium">
              {format(new Date(billingPeriodStart), 'PP')} → {format(new Date(billingPeriodEnd), 'PP')}
            </span>
          </div>
        )}
        {summary?.entryCount !== undefined && summary.entryCount !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              Time Entries
            </span>
            <span className="font-medium">{summary.entryCount}</span>
          </div>
        )}
        {summary?.contributorsCount !== undefined && summary.contributorsCount !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              Contributors
            </span>
            <span className="font-medium">{summary.contributorsCount}</span>
          </div>
        )}
        {summary?.tasksCount !== undefined && summary.tasksCount !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <ListChecks className="w-4 h-4" />
              Tasks Covered
            </span>
            <span className="font-medium">{summary.tasksCount}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
