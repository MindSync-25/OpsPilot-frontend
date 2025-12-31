
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crmService, type CrmClient } from '@/services/crmService'
import type { CreateClientRequest } from '@/services/clientService'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'


const LEAD_STAGE_COLORS: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  PROPOSAL_SENT: 'bg-purple-100 text-purple-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-gray-200 text-gray-700',
};


function Crm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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


  return (
    <ContentSection>
      <PageHeader
        title="CRM"
        subtitle="Manage all leads and client relationships"
        primaryAction={
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Lead
          </Button>
        }
      />
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
      <Card className="mt-6">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
          ) : error ? (
            <div className="text-center text-destructive py-8">Failed to load CRM clients</div>
          ) : (
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
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crmClients.map((client: CrmClient) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/app/crm/${client.id}`)}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.contactName || '-'}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.address || '-'}</TableCell>
                    <TableCell
                      onClick={e => {
                        e.stopPropagation();
                        // TODO: Open lead stage change dialog or inline select here
                        // Example: setEditLeadStageId(client.id)
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Badge className={LEAD_STAGE_COLORS[client.leadStage] || ''}>{client.leadStage}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={client.notes || ''}>{client.notes || '-'}</TableCell>
                    <TableCell>{client.nextFollowUp ? new Date(client.nextFollowUp).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{client.ownerName || '-'}</TableCell>
                    <TableCell>{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </ContentSection>
  );
}

export default Crm;
