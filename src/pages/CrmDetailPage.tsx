import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { crmService } from '@/services/crmService';
import type { CrmClient } from '@/services/crmService';
import { userService } from '@/services/userService';
import type { User as UserType } from '@/services/userService';
import ContentSection from '@/components/common/ContentSection';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, User, Mail, Phone, MapPin, FileText, Calendar, TrendingUp, Shield, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const LEAD_STAGE_COLORS: Record<string, string> = {
  PROSPECT: 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)]',
  CONTACTED: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
  PROPOSAL_SENT: 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary)]',
  WON: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
  LOST: 'bg-muted text-muted-foreground',
};

const LEAD_STAGES = ['PROSPECT', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'LOST'];
const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'PROSPECT'];

function CrmDetailPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditMode, setIsEditMode] = React.useState(false);
    const [editData, setEditData] = React.useState<Partial<CrmClient>>({});
    
    // Fetch all users for owner dropdown
const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: userService.getUsersForAssignment,
    });
    
    const updateMutation = useMutation({
      mutationFn: (data: any) => {
        if (!client?.id) throw new Error('Missing CRM id for update');
        return crmService.updateCrmClient(client.id, data);
      },
      onSuccess: () => {
        setIsEditMode(false);
        queryClient.invalidateQueries({ queryKey: ['crmClients'] });
      },
    });
    
    const { id } = useParams();
    const { data = [], isLoading, error } = useQuery({
      queryKey: ['crmClients'],
      queryFn: crmService.getAllCrmClients,
    });
    const client = (data as CrmClient[]).find((c) => c.id === id);

    const handleEdit = () => {
      if (client) {
        setEditData({
          name: client.name,
          contactName: client.contactName || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          status: client.status || 'ACTIVE',
          leadStage: client.leadStage,
          notes: client.notes || '',
          nextFollowUp: client.nextFollowUp ? client.nextFollowUp.split('T')[0] : '',
          ownerId: client.ownerId || '',
        });
        setIsEditMode(true);
      }
    };

    const handleCancel = () => {
      setIsEditMode(false);
      setEditData({});
    };

    const handleSave = () => {
      updateMutation.mutate(editData);
    };

  return (
    <ContentSection>
      <PageHeader 
        title="CRM Details" 
        subtitle={client ? client.name : id}
        primaryAction={
          <Button variant="outline" size="sm" onClick={() => navigate('/app/crm')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to CRM
          </Button>
        }
      />
      <div className="mt-8 space-y-6 max-w-6xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-8">Failed to load CRM client</div>
        ) : !client ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="mb-4">No CRM record found for this client.</div>
              <Button variant="default" size="sm">Create Lead</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <Building2 className="w-8 h-8 text-primary" />
                      <div className="flex-1">
                        {isEditMode ? (
                          <Input
                            value={editData.name || ''}
                            onChange={e => setEditData(f => ({ ...f, name: e.target.value }))}
                            className="text-3xl font-bold h-auto py-2 px-3"
                            required
                          />
                        ) : (
                          <>
                            <h2 className="text-3xl font-bold text-gray-900">{client.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">ID: {client.id}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {isEditMode ? (
                        <>
                          <Select
                            value={editData.leadStage || 'PROSPECT'}
                            onValueChange={(value) => setEditData(f => ({ ...f, leadStage: value }))}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LEAD_STAGES.map(stage => (
                                <SelectItem key={stage} value={stage}>
                                  {stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editData.status || 'ACTIVE'}
                            onValueChange={(value) => setEditData(f => ({ ...f, status: value }))}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CLIENT_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      ) : (
                        <>
                          <Badge className={`px-4 py-1.5 ${LEAD_STAGE_COLORS[client.leadStage] || ''}`}>
                            {client.leadStage}
                          </Badge>
                          {client.status && (
                            <Badge variant="outline" className="px-4 py-1.5">
                              {client.status}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditMode ? (
                      <>
                        <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit} size="lg">
                        Edit Details
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Contact Name
                    </div>
                    {isEditMode ? (
                      <Input
                        value={editData.contactName || ''}
                        onChange={e => setEditData(f => ({ ...f, contactName: e.target.value }))}
                        placeholder="Contact Name"
                      />
                    ) : (
                      <div className="text-base font-medium">{client.contactName || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </div>
                    {isEditMode ? (
                      <Input
                        type="email"
                        value={editData.email || ''}
                        onChange={e => setEditData(f => ({ ...f, email: e.target.value }))}
                        placeholder="Email"
                      />
                    ) : (
                      <div className="text-base font-medium">{client.email || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      Phone
                    </div>
                    {isEditMode ? (
                      <Input
                        value={editData.phone || ''}
                        onChange={e => setEditData(f => ({ ...f, phone: e.target.value }))}
                        placeholder="Phone"
                      />
                    ) : (
                      <div className="text-base font-medium">{client.phone || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Address
                    </div>
                    {isEditMode ? (
                      <Textarea
                        value={editData.address || ''}
                        onChange={e => setEditData(f => ({ ...f, address: e.target.value }))}
                        placeholder="Address"
                        rows={2}
                      />
                    ) : (
                      <div className="text-base font-medium whitespace-pre-line">{client.address || '-'}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CRM Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    CRM Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      Lead Stage
                    </div>
                    {isEditMode ? (
                      <Select
                        value={editData.leadStage || 'PROSPECT'}
                        onValueChange={(value) => setEditData(f => ({ ...f, leadStage: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STAGES.map(stage => (
                            <SelectItem key={stage} value={stage}>
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${LEAD_STAGE_COLORS[client.leadStage] || ''}`}>
                        {client.leadStage}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                      Status
                    </div>
                    {isEditMode ? (
                      <Select
                        value={editData.status || 'ACTIVE'}
                        onValueChange={(value) => setEditData(f => ({ ...f, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLIENT_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-base font-medium">{client.status || '-'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Owner
                    </div>
                    {isEditMode ? (
                      <Select
                        value={editData.ownerId || 'unassigned'}
                        onValueChange={(value) => setEditData(f => ({ ...f, ownerId: value === 'unassigned' ? undefined : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {allUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-base font-medium">{client.ownerName || 'Unassigned'}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Next Follow-up
                    </div>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={editData.nextFollowUp || ''}
                        onChange={e => setEditData(f => ({ ...f, nextFollowUp: e.target.value }))}
                      />
                    ) : (
                      <div className="text-base font-medium">
                        {client.nextFollowUp ? new Date(client.nextFollowUp).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : '-'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <Textarea
                    value={editData.notes || ''}
                    onChange={e => setEditData(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Add any additional notes..."
                    rows={6}
                    className="w-full"
                  />
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 min-h-[120px]">
                    <p className="text-base whitespace-pre-line">{client.notes || 'No notes available.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Created At</div>
                    <div className="text-base font-medium">
                      {client.createdAt ? new Date(client.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-1.5">Last Updated</div>
                    <div className="text-base font-medium">
                      {client.updatedAt ? new Date(client.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ContentSection>
  );
}

export default CrmDetailPage;

