import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useOnboarding } from '@/contexts/OnboardingContext';
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Plus,
  Search,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Eye,
  Send,
  CheckCheck,
  XCircle,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import { invoiceService } from '@/services/invoiceService';
import { clientService } from '@/services/clientService';
import { projectService } from '@/services/projectService';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { InvoiceDetailDrawer } from '@/components/invoices/InvoiceDetailDrawer';
import { GenerateInvoiceFromTimeDialog } from '@/components/invoices/GenerateInvoiceFromTimeDialog';
import type { Invoice, InvoiceFilters } from '@/types/invoice';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-muted text-muted-foreground';
    case 'SENT':
      return 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]';
    case 'PAID':
      return 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]';
    case 'OVERDUE':
      return 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]';
    case 'CANCELLED':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Invoices() {
  const queryClient = useQueryClient();
  const { shouldShowOnboarding, completedSteps } = useOnboarding();
  const { user } = useUserRole();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<InvoiceFilters>({
    sortBy: 'issueDate_desc',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [showGenerateFromTime, setShowGenerateFromTime] = useState(false);

  // Check if user can generate invoices from time (TOP_USER, SUPER_USER, ADMIN)
  const canGenerateFromTime =
    user?.role === 'TOP_USER' || user?.role === 'SUPER_USER' || user?.role === 'ADMIN';

  // Fetch data
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoiceService.getInvoices(filters),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getClients(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });

  // Create client and project lookup maps
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients]
  );

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  // Filter invoices by search term (client-side)
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const term = searchTerm.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        clientMap.get(inv.clientId)?.toLowerCase().includes(term) ||
        (inv.projectId && projectMap.get(inv.projectId)?.toLowerCase().includes(term))
    );
  }, [invoices, searchTerm, clientMap, projectMap]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const unpaidInvoices = invoices.filter(
      (inv) => inv.status === 'SENT' || inv.status === 'OVERDUE'
    );
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const overdueCount = invoices.filter((inv) => inv.isOverdue).length;
    const paidCount = invoices.filter((inv) => inv.status === 'PAID').length;

    return { unpaidAmount, overdueCount, paidCount };
  }, [invoices]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: invoiceService.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShowCreateForm(false);
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoiceService.updateInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceService.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setDeleteInvoiceId(null);
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete invoice');
    },
  });

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    await updateStatusMutation.mutateAsync({ id: invoiceId, status });
  };

  const handleDelete = async (invoiceId: string) => {
    await deleteMutation.mutateAsync(invoiceId);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailDrawer(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-500 mt-1">
            Manage and track all your invoices
          </p>
        </div>
        <div className="relative flex gap-2">
          {canGenerateFromTime && (
            <Button variant="outline" onClick={() => setShowGenerateFromTime(true)}>
              <Clock className="w-4 h-4 mr-2" />
              Generate from Time
            </Button>
          )}
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
          {shouldShowOnboarding && !completedSteps.includes('invoice') && user?.role !== 'USER' && (
            <OnboardingTooltip
              stepId="invoice-create"
              title="Create Your First Invoice"
              description="Track billing and manage payments by creating invoices for your clients and projects."
              position="bottom"
            />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Unpaid Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-[var(--accent-warning)] mr-2" />
              <span className="text-xl font-bold">
                ${summary.unpaidAmount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-[var(--accent-danger)] mr-2" />
              <span className="text-xl font-bold">{summary.overdueCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Paid Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-success)] mr-2" />
              <span className="text-xl font-bold">{summary.paidCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  status: value === 'all' ? undefined : (value as any),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Client Filter */}
            <Select
              value={filters.clientId || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  clientId: value === 'all' ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Project Filter */}
            <Select
              value={filters.projectId || 'all'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  projectId: value === 'all' ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: value as any,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="issueDate_desc">
                  Issue Date (Newest)
                </SelectItem>
                <SelectItem value="issueDate_asc">
                  Issue Date (Oldest)
                </SelectItem>
                <SelectItem value="dueDate_desc">
                  Due Date (Latest)
                </SelectItem>
                <SelectItem value="dueDate_asc">
                  Due Date (Earliest)
                </SelectItem>
                <SelectItem value="total_desc">
                  Amount (High to Low)
                </SelectItem>
                <SelectItem value="total_asc">
                  Amount (Low to High)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoadingInvoices ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No invoices found</p>
              <Button
                variant="link"
                onClick={() => setShowCreateForm(true)}
                className="mt-2"
              >
                Create your first invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{clientMap.get(invoice.clientId)}</TableCell>
                    <TableCell>
                      {invoice.projectId
                        ? projectMap.get(invoice.projectId)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                      {invoice.isOverdue && (
                        <span className="ml-2 text-red-500 text-xs">
                          Overdue
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${invoice.total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {invoice.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleUpdateStatus(invoice.id, 'SENT')
                            }
                            title="Mark as Sent"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {(invoice.status === 'SENT' ||
                          invoice.status === 'OVERDUE') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleUpdateStatus(invoice.id, 'PAID')
                            }
                            title="Mark as Paid"
                          >
                            <CheckCheck className="w-4 h-4 text-[var(--accent-success)]" />
                          </Button>
                        )}
                        {(invoice.status === 'DRAFT' ||
                          invoice.status === 'SENT') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleUpdateStatus(invoice.id, 'CANCELLED')
                            }
                            title="Cancel Invoice"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {invoice.status !== 'PAID' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteInvoiceId(invoice.id)}
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Form */}
      <InvoiceForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isLoading={createMutation.isPending}
      />

      {/* Invoice Detail Drawer */}
      <InvoiceDetailDrawer
        invoiceId={selectedInvoice?.id || null}
        open={showDetailDrawer}
        onOpenChange={setShowDetailDrawer}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteInvoiceId}
        onOpenChange={() => setDeleteInvoiceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInvoiceId && handleDelete(deleteInvoiceId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Invoice from Time Dialog */}
      <GenerateInvoiceFromTimeDialog
        open={showGenerateFromTime}
        onOpenChange={setShowGenerateFromTime}
      />
    </div>
  );
}
