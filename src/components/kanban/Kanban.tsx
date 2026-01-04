import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Calendar } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SubtaskList } from '@/components/tasks/SubtaskList'

export interface KanbanTask {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  assigneeUserId?: string | null
  dueDate?: string
}

interface KanbanProps {
  tasks: KanbanTask[]
  onTaskMove: (taskId: string, newStatus: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done') => void
  onTaskClick?: (taskId: string) => void
  userRole: string
  currentUserId?: string
}

const columns = [
  { id: 'todo' as const, title: 'To Do', color: 'bg-muted/50 dark:bg-muted/30' },
  { id: 'in_progress' as const, title: 'In Progress', color: 'bg-[var(--accent-primary-weak)] dark:bg-[var(--accent-primary-weak)]' },
  { id: 'blocked' as const, title: 'Blocked', color: 'bg-[var(--accent-danger)]/10 dark:bg-[var(--accent-danger)]/10' },
  { id: 'review' as const, title: 'Review', color: 'bg-[var(--accent-warning)]/10 dark:bg-[var(--accent-warning)]/10' },
  { id: 'done' as const, title: 'Done', color: 'bg-[var(--accent-success)]/10 dark:bg-[var(--accent-success)]/10' },
]

const priorityColors = {
  low: 'bg-[var(--accent-primary-weak)] text-[var(--accent-primary)] border-[var(--border-subtle)]',
  medium: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border-[var(--border-subtle)]',
  high: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border-[var(--border-subtle)]',
  urgent: 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] border-[var(--border-subtle)]',
}

interface TaskCardProps {
  task: KanbanTask
  userRole: string
  currentUserId?: string
  onClick?: () => void
}

function TaskCard({ task, userRole, currentUserId, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isTaskAssignee = task.assigneeUserId === currentUserId

  const handleCardClick = () => {
    // Don't trigger if we're dragging
    if (isDragging) {
      return
    }
    onClick?.()
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-lg hover:scale-[1.02] transition-all"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-2">
              <h4 className="text-sm font-medium text-foreground leading-tight">
                {task.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {task.priority && (
                  <Badge variant="outline" className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                )}
                {task.assignee && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-[10px] bg-primary/10">
                        {task.assignee[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{task.assignee}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {task.dueDate}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Subtasks Section */}
          <div className="mt-3 pt-3 border-t">
            <SubtaskList 
              taskId={task.id} 
              userRole={userRole}
              isTaskAssignee={isTaskAssignee}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ColumnProps {
  column: typeof columns[number]
  tasks: KanbanTask[]
  userRole: string
  currentUserId?: string
  onTaskClick?: (taskId: string) => void
}

function Column({ column, tasks, userRole, currentUserId, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      columnId: column.id,
    },
  })

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className={`${column.color} rounded-lg px-4 py-3 mb-4 border border-border`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            {column.title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Droppable Column Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] rounded-lg p-3 border-2 border-dashed transition-all ${
          isOver ? 'bg-primary/10 border-primary shadow-inner' : 'bg-muted/20 border-border'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-sm text-muted-foreground">Drop tasks here</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                userRole={userRole}
                currentUserId={currentUserId}
                onClick={() => onTaskClick?.(task.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export default function Kanban({ tasks, onTaskMove, onTaskClick, userRole, currentUserId }: KanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8 to make it easier to drag
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the active task
    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Check if we're over a column
    const overColumn = columns.find((col) => col.id === overId)
    if (overColumn && activeTask.status !== overColumn.id) {
      onTaskMove(activeTask.id, overColumn.id)
      return
    }

    // Check if we're over another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && activeTask.status !== overTask.status) {
      onTaskMove(activeTask.id, overTask.status)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // Check if dropped over a column
    const overColumn = columns.find((col) => col.id === over.id)
    if (overColumn && activeTask.status !== overColumn.id) {
      onTaskMove(activeTask.id, overColumn.id)
      toast.success('Task moved', {
        description: `"${activeTask.title}" moved to ${overColumn.title}`,
      })
      return
    }

    // Check if dropped over another task
    const overTask = tasks.find((t) => t.id === over.id)
    if (overTask && activeTask.status !== overTask.status) {
      onTaskMove(activeTask.id, overTask.status)
      const column = columns.find((col) => col.id === overTask.status)
      toast.success('Task moved', {
        description: `"${activeTask.title}" moved to ${column?.title}`,
      })
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id)
          return (
            <Column 
              key={column.id} 
              column={column} 
              tasks={columnTasks}
              userRole={userRole}
              currentUserId={currentUserId}
              onTaskClick={onTaskClick}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <Card className="cursor-grabbing rotate-3 shadow-2xl ring-2 ring-primary">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">
                    {activeTask.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeTask.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
