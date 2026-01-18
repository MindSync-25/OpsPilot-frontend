import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Mail, Eye } from 'lucide-react'
import type { CrmClient } from '@/services/crmService'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CrmPipelineKanbanProps {
  clients: CrmClient[]
  onStageChange: (clientId: string, newStage: string) => void
}

const LEAD_STAGES = [
  { id: 'PROSPECT', label: 'Prospect', color: 'bg-muted/50 dark:bg-muted/30' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-[var(--accent-primary-weak)] dark:bg-[var(--accent-primary-weak)]' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-[var(--accent-warning)]/10 dark:bg-[var(--accent-warning)]/10' },
  { id: 'WON', label: 'Won', color: 'bg-[var(--accent-success)]/10 dark:bg-[var(--accent-success)]/10' },
  { id: 'LOST', label: 'Lost', color: 'bg-[var(--accent-danger)]/10 dark:bg-[var(--accent-danger)]/10' },
]

interface LeadCardProps {
  client: CrmClient
  isDragging?: boolean
}

function LeadCard({ client, isDragging }: LeadCardProps) {
  const navigate = useNavigate()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: client.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  const handleCall = (e: React.MouseEvent, phone?: string | null) => {
    e.stopPropagation()
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  const handleEmail = (e: React.MouseEvent, email?: string | null) => {
    e.stopPropagation()
    if (email) {
      window.location.href = `mailto:${email}`
    }
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/app/crm/${client.id}`)
  }

  const handleCardClick = () => {
    if (!isSortableDragging) {
      navigate(`/app/crm/${client.id}`)
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        className={`mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-sm line-clamp-1">{client.name}</h4>
              {client.status && (
                <Badge variant="outline" className="text-xs ml-2 shrink-0">
                  {client.status}
                </Badge>
              )}
            </div>

            {client.contactName && (
              <p className="text-xs text-muted-foreground line-clamp-1">{client.contactName}</p>
            )}

            <div className="flex items-center gap-1">
              {client.phone && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={(e) => handleCall(e, client.phone)}
                  title={`Call ${client.phone}`}
                >
                  <Phone className="h-3 w-3" />
                </Button>
              )}
              {client.email && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={(e) => handleEmail(e, client.email)}
                  title={`Email ${client.email}`}
                >
                  <Mail className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 ml-auto"
                onClick={handleView}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>

            {client.nextFollowUp && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Follow-up: {new Date(client.nextFollowUp).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface StageColumnProps {
  stage: typeof LEAD_STAGES[number]
  clients: CrmClient[]
}

function StageColumn({ stage, clients }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      type: 'column',
      stageId: stage.id,
    },
  })

  return (
    <div className="flex flex-col">
      <Card className={`${stage.color} mb-4`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>{stage.label}</span>
            <Badge variant="secondary" className="ml-2">
              {clients.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] rounded-lg p-2 border-2 border-dashed transition-all ${
          isOver ? 'bg-primary/10 border-primary shadow-inner' : 'bg-muted/30 border-border'
        }`}
      >
        <SortableContext
          items={clients.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {clients.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Drop leads here</p>
            </div>
          ) : (
            clients.map((client) => (
              <LeadCard key={client.id} client={client} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function CrmPipelineKanban({ clients, onStageChange }: CrmPipelineKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeClient = clients.find(c => c.id === active.id)
    if (!activeClient) return

    // Check if we're over a column
    const overColumn = LEAD_STAGES.find(s => s.id === over.id)
    if (overColumn && activeClient.leadStage !== overColumn.id) {
      onStageChange(activeClient.id, overColumn.id)
      return
    }

    // Check if we're over another client card
    const overClient = clients.find(c => c.id === over.id)
    if (overClient && activeClient.leadStage !== overClient.leadStage) {
      onStageChange(activeClient.id, overClient.leadStage)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeClient = clients.find(c => c.id === active.id)
    if (!activeClient) return

    // Check if dropped over a different stage column
    const overColumn = LEAD_STAGES.find(s => s.id === over.id)
    if (overColumn && activeClient.leadStage !== overColumn.id) {
      onStageChange(activeClient.id, overColumn.id)
    }
  }

  const getStageClients = (stageId: string) => {
    return clients.filter(c => c.leadStage === stageId)
  }

  const activeClient = activeId ? clients.find(c => c.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-5 gap-4 min-h-[600px]">
        {LEAD_STAGES.map((stage) => {
          const stageClients = getStageClients(stage.id)
          return (
            <StageColumn key={stage.id} stage={stage} clients={stageClients} />
          )
        })}
      </div>

      <DragOverlay>
        {activeClient ? (
          <LeadCard client={activeClient} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
