import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import type { Invoice, CreateInvoiceRequest } from '@/types/invoice';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

const invoiceFormSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().optional(),
  taxRate: z.number().min(0).max(100),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInvoiceRequest) => Promise<void>;
  invoice?: Invoice;
  isLoading?: boolean;
}

export function InvoiceForm({
  open,
  onClose,
  onSubmit,
  invoice,
  isLoading = false,
}: InvoiceFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    invoice?.clientId
  );

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });

  // Filter projects by selected client
  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          projectId: invoice.projectId || '',
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate || '',
          taxRate: invoice.taxRate,
          notes: invoice.notes || '',
          items: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }
      : {
          clientId: '',
          projectId: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          taxRate: 18,
          notes: '',
          items: [
            {
              description: '',
              quantity: 1,
              unitPrice: 0,
            },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchItems = form.watch('items');
  const watchTaxRate = form.watch('taxRate');

  // Calculate preview totals (not source of truth, just for display)
  const calculatePreviewTotals = () => {
    const subtotal = watchItems.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);

    const taxAmount = (subtotal * (Number(watchTaxRate) || 0)) / 100;
    const total = subtotal + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calculatePreviewTotals();

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    form.setValue('clientId', clientId);
    // Reset project if it doesn't belong to the new client
    const currentProjectId = form.getValues('projectId');
    if (currentProjectId) {
      const projectBelongsToClient = projects.find(
        (p) => p.id === currentProjectId && p.clientId === clientId
      );
      if (!projectBelongsToClient) {
        form.setValue('projectId', '');
      }
    }
  };

  const handleSubmit = async (data: InvoiceFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? 'Edit Invoice' : 'Create Invoice'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Client and Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">
                Client <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.watch('clientId')}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.clientId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project (Optional)</Label>
              <Select
                value={form.watch('projectId') || undefined}
                onValueChange={(value) => form.setValue('projectId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates and Tax Rate */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">
                Issue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                {...form.register('issueDate')}
                className={
                  form.formState.errors.issueDate ? 'border-red-500' : ''
                }
              />
              {form.formState.errors.issueDate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.issueDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input type="date" {...form.register('dueDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('taxRate', { valueAsNumber: true })}
                placeholder="18.00"
              />
              {form.formState.errors.taxRate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.taxRate.message}
                </p>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">
                Invoice Items <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ description: '', quantity: 1, unitPrice: 0 })
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">
                      Description
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium w-24">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium w-32">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium w-32">
                      Amount
                    </th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const qty = Number(watchItems[index]?.quantity) || 0;
                    const price = Number(watchItems[index]?.unitPrice) || 0;
                    const amount = (qty * price).toFixed(2);

                    return (
                      <tr key={field.id} className="border-t">
                        <td className="px-4 py-2">
                          <Input
                            {...form.register(`items.${index}.description`)}
                            placeholder="Description"
                            className={
                              form.formState.errors.items?.[index]?.description
                                ? 'border-red-500'
                                : ''
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                            min="1"
                            className={
                              form.formState.errors.items?.[index]?.quantity
                                ? 'border-red-500'
                                : ''
                            }
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            min="0"
                            className={
                              form.formState.errors.items?.[index]?.unitPrice
                                ? 'border-red-500'
                                : ''
                            }
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium">
                          ${amount}
                        </td>
                        <td className="px-4 py-2">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {form.formState.errors.items && (
              <p className="text-sm text-red-500">
                {form.formState.errors.items.message}
              </p>
            )}
          </div>

          {/* Totals Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">${totals.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax ({watchTaxRate}%):</span>
              <span className="font-medium">${totals.taxAmount}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Total:</span>
              <span>${totals.total}</span>
            </div>
            <p className="text-xs text-gray-500 italic">
              * Final totals will be calculated by the server
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              {...form.register('notes')}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : invoice
                ? 'Update Invoice'
                : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
