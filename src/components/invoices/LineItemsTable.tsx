import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Invoice } from '@/types/invoice';
import { formatCurrency, minutesToHM } from '@/lib/utils';

interface LineItemsTableProps {
  invoice: Invoice;
}

export function LineItemsTable({ invoice }: LineItemsTableProps) {
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);

  const currencyCode = invoice.currencyCode || 'USD';

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium w-24">Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-medium w-28">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.description}</div>
                      {/* Subtext: task/contributor info */}
                      {item.itemType === 'TIME' && (item.user || item.task) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.user?.name}
                          {item.user && item.task && ' • '}
                          {item.task?.title}
                        </div>
                      )}
                      {/* View source link */}
                      {item.sourceTimeEntryIds && item.sourceTimeEntryIds.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs mt-1"
                          onClick={() => {
                            setSelectedSourceIds(item.sourceTimeEntryIds || []);
                            setShowSourceDialog(true);
                          }}
                        >
                          View source ({item.sourceTimeEntryIds.length})
                        </Button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.itemType === 'TIME' && item.minutes
                        ? minutesToHM(item.minutes)
                        : item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.rate !== undefined
                        ? formatCurrency(item.rate, currencyCode)
                        : item.unitPrice !== undefined
                        ? formatCurrency(item.unitPrice, currencyCode)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(item.amount || 0, currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/30">
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-sm">
                    Subtotal
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(invoice.subtotal, currencyCode)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-right text-sm">
                    Tax ({invoice.taxRate}%)
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(invoice.taxAmount, currencyCode)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td colSpan={3} className="px-4 py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold">
                    {formatCurrency(invoice.total, currencyCode)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Source Entries Dialog */}
      <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Source Time Entries</DialogTitle>
            <DialogDescription>
              Time entry IDs that contributed to this line item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedSourceIds.map((id, idx) => (
              <div key={idx} className="p-2 bg-muted rounded text-sm font-mono">
                {id}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
