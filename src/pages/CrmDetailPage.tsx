import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { crmService } from '@/services/crmService';
import type { CrmClient } from '@/services/crmService';
import ContentSection from '@/components/common/ContentSection';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const LEAD_STAGE_COLORS: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  PROPOSAL_SENT: 'bg-purple-100 text-purple-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-gray-200 text-gray-700',
};

function CrmDetailPage() {
    const queryClient = useQueryClient();
    const [editOpen, setEditOpen] = React.useState(false);
    const [editData, setEditData] = React.useState<Partial<CrmClient>>({});
      const updateMutation = useMutation({
        mutationFn: (data: any) => {
          // Use client.id (CRM record ID) for update
          if (!client?.id) throw new Error('Missing CRM id for update');
          return crmService.updateCrmClient(client.id, data);
        },
        onSuccess: () => {
          setEditOpen(false);
          queryClient.invalidateQueries({ queryKey: ['crmClients'] });
        },
      });
  const { id } = useParams();
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['crmClients'],
    queryFn: crmService.getAllCrmClients,
  });
  const client = (data as CrmClient[]).find((c) => c.id === id);

  return (
    <ContentSection>
      <PageHeader title="CRM Details" subtitle={client ? client.name : id} />
      <div className="flex justify-center mt-8">
        <Card className="w-full max-w-3xl shadow-xl border-0 bg-gradient-to-br from-white to-slate-100">
          <CardContent className="p-8">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              </div>
            ) : error ? (
              <div className="text-center text-destructive py-8">Failed to load CRM client</div>
            ) : !client ? (
              <div className="text-center py-8">
                <div className="mb-4">No CRM record found for this client.</div>
                <Button variant="default" size="sm">Create Lead</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-8">
                  <Badge className={`text-lg px-4 py-2 rounded-full ${LEAD_STAGE_COLORS[client.leadStage] || ''}`}>{client.leadStage}</Badge>
                  <span className="text-2xl font-bold text-primary">{client.name}</span>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={() => { setEditData(client); setEditOpen(true); }}>
                    Edit
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Contact Name</div>
                    <div className="font-medium text-base">{client.contactName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                    <div className="font-medium text-base">{client.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Phone</div>
                    <div className="font-medium text-base">{client.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Address</div>
                    <div className="font-medium text-base">{client.address || '-'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Notes</div>
                    <div className="font-medium text-base whitespace-pre-line bg-slate-50 rounded p-3 border border-slate-100 min-h-[48px]">{client.notes || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Owner</div>
                    <div className="font-medium text-base">{client.ownerName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Next Follow-up</div>
                    <div className="font-medium text-base">{client.nextFollowUp ? new Date(client.nextFollowUp).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                    <div className="font-medium text-base">{client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Updated</div>
                    <div className="font-medium text-base">{client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : '-'}</div>
                  </div>
                </div>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit CRM Details</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        updateMutation.mutate(editData);
                      }}
                      className="space-y-4"
                    >
                      <Input
                        placeholder="Client Name"
                        value={editData.name || ''}
                        onChange={e => setEditData(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                      <Input
                        placeholder="Contact Name"
                        value={editData.contactName || ''}
                        onChange={e => setEditData(f => ({ ...f, contactName: e.target.value }))}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={editData.email || ''}
                        onChange={e => setEditData(f => ({ ...f, email: e.target.value }))}
                      />
                      <Input
                        placeholder="Phone"
                        value={editData.phone || ''}
                        onChange={e => setEditData(f => ({ ...f, phone: e.target.value }))}
                      />
                      <Input
                        placeholder="Address"
                        value={editData.address || ''}
                        onChange={e => setEditData(f => ({ ...f, address: e.target.value }))}
                      />
                      <Input
                        placeholder="Notes"
                        value={editData.notes || ''}
                        onChange={e => setEditData(f => ({ ...f, notes: e.target.value }))}
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ContentSection>
  );
}

export default CrmDetailPage;

