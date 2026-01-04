import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip'
import { crmService, type CrmClient } from '@/services/crmService'
import type { CreateClientRequest } from '@/services/clientService'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Loader2, Plus, Search, Target, TrendingUp, UserCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Summary card component
function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color?: string }) {
  return (
    <Card className="flex-1 min-w-[160px] rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`rounded-full p-2 ${color || 'bg-[var(--accent-primary-weak)]'} flex items-center justify-center`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

const LEAD_STAGE_COLORS: Record<string, string> = {
  PROSPECT: 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]',
  CONTACTED: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
  PROPOSAL_SENT: 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]',
  WON: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
  LOST: 'bg-muted text-muted-foreground',
};

function Crm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { shouldShowOnboarding, completedSteps } = useOnboarding();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState('all');
  
  const [formData, setFormData] = useState<CreateClientRequest>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
  });
  
  const { data: crmClients = [], isLoading, error } = useQuery({
    queryKey: ['crmClients'],
    queryFn: crmService.getAllCrmClients,
  });
  
  const createMutation = useMutation({
    mutationFn: crmService.createLead,
    onSuccess: () => {
      setIsDialogOpen(false);
      setFormData({ name: '', contactName: '', email: '', phone: '', address: '', status: 'ACTIVE' });
      queryClient.invalidateQueries({ queryKey: ['crmClients'] });
    },
  });

  // Filter CRM clients
  const filteredClients = useMemo(() => {
    return crmClients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLeadStage = leadStageFilter === 'all' || client.leadStage === leadStageFilter
      return matchesSearch && matchesLeadStage
    })
  }, [crmClients, searchTerm, leadStageFilter])

  // Summary stats
  const totalLeads = crmClients.length
  const prospectLeads = crmClients.filter((c) => c.leadStage === 'PROSPECT').length
  const contactedLeads = crmClients.filter((c) => c.leadStage === 'CONTACTED').length
  const proposalSentLeads = crmClients.filter((c) => c.leadStage === 'PROPOSAL_SENT').length
  const wonLeads = crmClients.filter((c) => c.leadStage === 'WON').length

  if (isLoading) {
    return (
      <ContentSection>
        <PageHeader
          title="CRM"
          subtitle="Manage all leads and client relationships"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading leads...</p>
          </div>
        </div>
      </ContentSection>
    )
  }

  if (error) {
    return (
      <ContentSection>
        <PageHeader
          title="CRM"
          subtitle="Manage all leads and client relationships"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <p className="text-sm text-destructive">Failed to load leads</p>
            <p className="text-xs text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </ContentSection>
    )
  }

  return (
    <ContentSection>
      <PageHeader
        title="CRM"
        subtitle="Manage all leads and client relationships"
        primaryAction={
          <div className="relative">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Lead
            </Button>
            {shouldShowOnboarding && !completedSteps.includes('crm') && (
              <OnboardingTooltip
                stepId="crm-create"
                title="Track Your First Opportunity"
                description="Add leads and opportunities to manage your sales pipeline. Track deals from prospect to close."
                position="bottom"
              />
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <SummaryCard icon={<Users className="w-5 h-5 text-[var(--accent-primary)]" />} label="Total Leads" value={totalLeads} color="bg-[var(--accent-primary-weak)]" />
        <SummaryCard icon={<Target className="w-5 h-5 text-[var(--accent-primary)]" />} label="Prospect" value={prospectLeads} color="bg-[var(--accent-primary-weak)]" />
        <SummaryCard icon={<UserCheck className="w-5 h-5 text-[var(--accent-warning)]" />} label="Contacted" value={contactedLeads} color="bg-[var(--accent-warning)]/10" />
        <SummaryCard icon={<TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" />} label="Proposal Sent" value={proposalSentLeads} color="bg-[var(--accent-primary-soft)]" />
        <SummaryCard icon={<UserCheck className="w-5 h-5 text-[var(--accent-success)]" />} label="Won" value={wonLeads} color="bg-[var(--accent-success)]/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, phone, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={leadStageFilter} onValueChange={setLeadStageFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by lead stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="PROSPECT">Prospect</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
            <SelectItem value="WON">Won</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <Card className="mt-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Lead Stage</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Next Follow-up</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {searchTerm || leadStageFilter !== 'all' 
                      ? 'No leads found matching your filters' 
                      : 'No leads yet. Create your first lead to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client: CrmClient) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/app/crm/${client.id}`)}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.contactName || '-'}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.address || '-'}</TableCell>
                    <TableCell>
                      <Badge className={LEAD_STAGE_COLORS[client.leadStage] || ''}>{client.leadStage.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={client.notes || ''}>{client.notes || '-'}</TableCell>
                    <TableCell>{client.nextFollowUp ? new Date(client.nextFollowUp).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{client.ownerName || '-'}</TableCell>
                    <TableCell>{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Lead Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Lead</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (!formData.name.trim()) return;
              createMutation.mutate(formData);
            }}
            className="space-y-4"
          >
            <Input
              placeholder="Client Name *"
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Contact Name"
              value={formData.contactName}
              onChange={e => setFormData(f => ({ ...f, contactName: e.target.value }))}
            />
            <Input
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
            />
            <Input
              placeholder="Address"
              value={formData.address}
              onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ContentSection>
  );
}

export default Crm;
