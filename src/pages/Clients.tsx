import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, Loader2, Mail, Phone, Edit, Trash2, Search, Users, UserCheck, UserX, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useOnboarding } from '@/contexts/OnboardingContext'
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip'
import { clientService, type CreateClientRequest, type UpdateClientRequest, type Client } from '@/services/clientService'
import { useUserRole } from '@/hooks/useUserRole'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import EmptyState from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function Clients() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { canCreateClients } = useUserRole()
  const { shouldShowOnboarding, completedSteps } = useOnboarding()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [formData, setFormData] = useState<CreateClientRequest>({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
  })

  // Fetch clients
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: clientService.getClients,
  })

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter])

  // Summary stats
  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === 'ACTIVE').length
  const inactiveClients = clients.filter((c) => c.status === 'INACTIVE').length
  const prospectClients = clients.filter((c) => c.status === 'PROSPECT').length

  // Create client mutation
  const createMutation = useMutation({
    mutationFn: clientService.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success('Client created successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error('Failed to create client', {
        description: err.response?.data?.message || 'Please try again',
      })
    },
  })

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientRequest }) =>
      clientService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setIsEditDialogOpen(false)
      setSelectedClient(null)
      resetForm()
      toast.success('Client updated successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error('Failed to update client', {
        description: err.response?.data?.message || 'Please try again',
      })
    },
  })

  // Delete client mutation
  const deleteMutation = useMutation({
    mutationFn: clientService.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setDeleteClientId(null)
      toast.success('Client deleted successfully')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error('Failed to delete client', {
        description: err.response?.data?.message || 'Please try again',
      })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      status: 'ACTIVE',
    })
  }

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Client name is required')
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !formData.name.trim()) {
      toast.error('Client name is required')
      return
    }
    updateMutation.mutate({ id: selectedClient.id, data: formData })
  }

  const openEditDialog = (client: Client) => {
    setSelectedClient(client)
    setFormData({
      name: client.name,
      contactName: client.contactName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      status: client.status || 'ACTIVE',
    })
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--border-subtle)] flex items-center gap-1">
            <UserCheck className="w-3 h-3 mr-1" /> Active
          </Badge>
        )
      case 'INACTIVE':
        return (
          <Badge className="bg-gray-200 text-gray-700 border-gray-300 flex items-center gap-1">
            <UserX className="w-3 h-3 mr-1 text-gray-500" /> Inactive
          </Badge>
        )
      case 'PROSPECT':
        return (
          <Badge className="bg-[var(--accent-primary-weak)] text-[var(--accent-primary)] border-[var(--border-subtle)] flex items-center gap-1">
            <UserPlus className="w-3 h-3 mr-1" /> Prospect
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <ContentSection>
        <PageHeader
          title="Clients"
          subtitle="Manage your client relationships"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading clients...</p>
          </div>
        </div>
      </ContentSection>
    )
  }

  if (error) {
    return (
      <ContentSection>
        <PageHeader
          title="Clients"
          subtitle="Manage your client relationships"
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <p className="text-sm text-destructive">Failed to load clients</p>
            <p className="text-xs text-muted-foreground">
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Please try again later'}
            </p>
          </div>
        </div>
      </ContentSection>
    )
  }


  return (
    <ContentSection>
      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships and accounts"
        primaryAction={
          canCreateClients ? (
            <div className="relative">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add Client
              </Button>
              {shouldShowOnboarding && !completedSteps.includes('client') && (
                <OnboardingTooltip
                  stepId="client-create"
                  title="Add Your First Client"
                  description="Create a client to track projects, time, and invoices. Start building your client portfolio."
                  position="bottom"
                />
              )}
            </div>
          ) : undefined
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <SummaryCard icon={<Users className="w-6 h-6 text-primary" />} label="Total Clients" value={totalClients} color="bg-primary/10" />
        <SummaryCard icon={<UserCheck className="w-6 h-6 text-[var(--accent-success)]" />} label="Active" value={activeClients} color="bg-[var(--accent-success)]/10" />
        <SummaryCard icon={<UserX className="w-6 h-6 text-gray-500" />} label="Inactive" value={inactiveClients} color="bg-gray-200" />
        <SummaryCard icon={<UserPlus className="w-6 h-6 text-[var(--accent-primary)]" />} label="Prospects" value={prospectClients} color="bg-[var(--accent-primary-weak)]" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PROSPECT">Prospect</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchTerm || statusFilter !== 'all' ? 'No clients found' : 'No clients yet'}
          description={
            searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first client to track projects and revenue'
          }
          action={
            canCreateClients && !searchTerm && statusFilter === 'all' ? (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Add Client
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="mt-6">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-primary/5 transition"
                    onClick={() => navigate(`/app/clients/${client.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          {/* If you have a logo/image, use <AvatarImage src={client.logoUrl} /> */}
                          <AvatarFallback>
                            {client.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>{client.contactName || '-'}</TableCell>
                    <TableCell>
                      {client.email ? (
                        <a
                          href={`mailto:${client.email}`}
                          className="text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <a
                          href={`tel:${client.phone}`}
                          className="text-primary hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(client.status || 'ACTIVE')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canCreateClients && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-accent transition"
                              title="Edit client"
                              onClick={e => { e.stopPropagation(); openEditDialog(client); }}
                            >
                              <Edit className="w-4 h-4 text-[var(--accent-primary)]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-red-100 transition"
                              title="Delete client"
                              onClick={e => { e.stopPropagation(); setDeleteClientId(client.id); }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Client Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Add a new client to your workspace. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateClient}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter client name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Person</Label>
                <Input
                  id="contactName"
                  placeholder="Enter contact person name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter client address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Add Client'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateClient}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Client Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter client name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactName">Contact Person</Label>
                <Input
                  id="edit-contactName"
                  placeholder="Enter contact person name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  placeholder="Enter client address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedClient(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Client'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteClientId} onOpenChange={() => setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteClientId) {
                  deleteMutation.mutate(deleteClientId)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContentSection>
  )
}
