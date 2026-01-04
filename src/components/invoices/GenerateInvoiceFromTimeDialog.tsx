import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import {
  invoiceGenerationService,
  type InvoiceGenerationPreviewRequest,
  type InvoiceGenerationPreviewResponse,
} from '@/services/invoiceGenerationService';
import { AlertTriangle, Clock, DollarSign, FileText, Loader2 } from 'lucide-react';

interface GenerateInvoiceFromTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatMinutesToHHMM = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, '0')}m`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export function GenerateInvoiceFromTimeDialog({
  open,
  onOpenChange,
}: GenerateInvoiceFromTimeDialogProps) {
  const queryClient = useQueryClient();

  // Form state
  const [clientId, setClientId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [billableOnly, setBillableOnly] = useState<boolean>(true);
  const [groupBy, setGroupBy] = useState<'USER' | 'TASK'>('USER');
  const [notes, setNotes] = useState<string>('');

  // Preview state
  const [preview, setPreview] = useState<InvoiceGenerationPreviewResponse | null>(null);

  // Fetch clients
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getClients,
  });

  // Fetch projects for selected client
  const { data: allProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
    enabled: !!clientId,
  });

  const clientProjects = allProjects.filter((p: { clientId: string; id: string; name: string }) => p.clientId === clientId);

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: (payload: InvoiceGenerationPreviewRequest) =>
      invoiceGenerationService.previewFromTime(payload),
    onSuccess: (data) => {
      setPreview(data);
      if (!data.canGenerate && data.message) {
        toast.error(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate preview');
    },
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: invoiceGenerationService.generateFromTime,
    onSuccess: (data) => {
      toast.success(`Invoice ${data.invoiceNumber} created successfully with ${data.billedEntriesCount} billed entries.`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onOpenChange(false);
      // Reset form
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate invoice');
    },
  });

  const resetForm = () => {
    setClientId('');
    setProjectId('');
    setFromDate('');
    setToDate('');
    setBillableOnly(true);
    setGroupBy('USER');
    setNotes('');
    setPreview(null);
  };

  const handlePreview = () => {
    if (!clientId || !fromDate || !toDate) {
      toast.error('Please select client and date range');
      return;
    }

    const payload: InvoiceGenerationPreviewRequest = {
      clientId,
      projectId: projectId && projectId !== 'ALL_PROJECTS' ? projectId : undefined,
      fromDate,
      toDate,
      billableOnly,
      groupBy,
      includeDescriptions: false,
    };

    previewMutation.mutate(payload);
  };

  const handleGenerate = () => {
    if (!preview || !preview.canGenerate) return;

    // Confirm dialog
    const confirmed = window.confirm(
      `This will mark ${preview.entriesCount} time entries as billed. Continue?`
    );

    if (!confirmed) return;

    const payload = {
      clientId,
      projectId: projectId && projectId !== 'ALL_PROJECTS' ? projectId : undefined,
      fromDate,
      toDate,
      billableOnly,
      groupBy,
      includeDescriptions: false,
      notes: notes || undefined,
      confirmed: true,
    };

    generateMutation.mutate(payload);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const canGenerate =
    preview &&
    preview.canGenerate &&
    preview.entriesCount > 0 &&
    (!preview.missingRates || preview.missingRates.length === 0);

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Invoice from Time Entries</DialogTitle>
          <DialogDescription>
            Preview and generate a draft invoice from unbilled time entries
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="client">
                Client <span className="text-red-500">*</span>
              </Label>
              {loadingClients ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client">
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
              )}
            </div>

            {/* Project (optional) */}
            <div className="space-y-2">
              <Label htmlFor="project">Project (optional)</Label>
              {loadingProjects ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={projectId} onValueChange={(value) => setProjectId(value === "ALL_PROJECTS" ? "" : value)}>
                  <SelectTrigger id="project" disabled={!clientId}>
                    <SelectValue placeholder="All projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_PROJECTS">All projects</SelectItem>
                    {clientProjects.map((project: { id: string; name: string }) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* From Date */}
            <div className="space-y-2">
              <Label htmlFor="fromDate">
                From Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <Label htmlFor="toDate">
                To Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            {/* Billable Only */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="billableOnly"
                checked={billableOnly}
                onCheckedChange={(checked) => setBillableOnly(checked === true)}
              />
              <Label htmlFor="billableOnly" className="cursor-pointer">
                Billable entries only
              </Label>
            </div>

            {/* Group By */}
            <div className="space-y-2">
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'USER' | 'TASK')}>
                <SelectTrigger id="groupBy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="TASK">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for the invoice..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview Button */}
          <Button
            onClick={handlePreview}
            disabled={!clientId || !fromDate || !toDate || previewMutation.isPending}
            className="w-full"
          >
            {previewMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Preview...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Preview
              </>
            )}
          </Button>

          {/* Preview Loading Skeleton */}
          {previewMutation.isPending && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {/* Preview Results */}
          {preview && !previewMutation.isPending && (
            <div className="space-y-4 border rounded-lg p-4">
              {/* Missing Rates Warning */}
              {preview.missingRates && preview.missingRates.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Hourly rate missing for:{' '}
                    <strong>{preview.missingRates.map((u) => u.name).join(', ')}</strong> — add
                    rates in Team module before generating.
                  </AlertDescription>
                </Alert>
              )}

              {/* Empty State */}
              {preview.entriesCount === 0 && (
                <Alert>
                  <AlertDescription>
                    No unbilled billable time entries found in this date range.
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary Cards */}
              {preview.entriesCount > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        Total Hours
                      </div>
                      <div className="text-2xl font-bold">
                        {formatMinutesToHHMM(preview.totalMinutes)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {preview.totalHours.toFixed(2)} hrs
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        Subtotal
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(preview.subtotal)}</div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        Tax ({preview.taxRate}%)
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(preview.taxAmount)}</div>
                    </div>

                    <div className="border rounded-lg p-4 bg-primary/5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <DollarSign className="h-4 w-4" />
                        Total
                      </div>
                      <div className="text-2xl font-bold">{formatCurrency(preview.total)}</div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div>
                    <h3 className="font-semibold mb-2">Line Items Preview</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Description</th>
                            <th className="text-right p-3 text-sm font-medium w-24">Qty</th>
                            <th className="text-right p-3 text-sm font-medium w-28">Rate</th>
                            <th className="text-right p-3 text-sm font-medium w-32">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {preview.lineItems && preview.lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-3 text-sm">{item.description}</td>
                              <td className="p-3 text-sm text-right">
                                {formatMinutesToHHMM(item.quantityMinutes)}
                              </td>
                              <td className="p-3 text-sm text-right">
                                {formatCurrency(item.unitPrice)}/hr
                              </td>
                              <td className="p-3 text-sm text-right font-medium">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t bg-muted/30">
                          <tr>
                            <td colSpan={3} className="p-3 text-sm text-right">
                              Subtotal
                            </td>
                            <td className="p-3 text-sm text-right font-medium">
                              {formatCurrency(preview.subtotal)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={3} className="p-3 text-sm text-right">
                              Tax ({preview.taxRate}%)
                            </td>
                            <td className="p-3 text-sm text-right font-medium">
                              {formatCurrency(preview.taxAmount)}
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td colSpan={3} className="p-3 text-sm text-right font-semibold">
                              Total
                            </td>
                            <td className="p-3 text-sm text-right text-lg font-bold">
                              {formatCurrency(preview.total)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {preview.entriesCount} time {preview.entriesCount === 1 ? 'entry' : 'entries'} will be marked as billed
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Generate Button */}
          {preview && (
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || generateMutation.isPending}
              className="w-full"
              variant="default"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Invoice...
                </>
              ) : (
                'Generate Draft Invoice'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
