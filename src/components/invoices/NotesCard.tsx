import { FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Invoice } from '@/types/invoice';

interface NotesCardProps {
  invoice: Invoice;
}

export function NotesCard({ invoice }: NotesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoice.notes ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {invoice.notes}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No notes added.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
