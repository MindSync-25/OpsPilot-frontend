import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { CreateManualTimeEntryRequest } from '@/services/timeEntryService'
import type { Project } from '@/services/projectService'
import type { Task } from '@/services/taskService'

interface ManualEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: CreateManualTimeEntryRequest) => void
  isLoading: boolean
  projects: Project[]
  tasks: Task[]
}

interface WeekDay {
  date: string
  dayName: string
  dayNumber: number
}

export function ManualEntryDialog({ open, onOpenChange, onSubmit, isLoading, projects, tasks }: ManualEntryDialogProps) {
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [weekStart, setWeekStart] = useState<Date>(getWeekStart(new Date()))
  const [weekHours, setWeekHours] = useState<Record<string, string>>({})
  const [isBillable, setIsBillable] = useState(true)
  const [notes, setNotes] = useState('')

  const filteredTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject) : []

  // Get the Sunday of the current week
  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day // Get Sunday
    return new Date(d.setDate(diff))
  }

  // Generate week days array using useMemo
  const weekDays = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const days: WeekDay[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        dayName: dayNames[i],
        dayNumber: date.getDate()
      })
    }
    return days
  }, [weekStart])

  // Initialize week hours - derived from weekDays
  const initialWeekHours = useMemo(() => {
    const initialHours: Record<string, string> = {}
    weekDays.forEach(day => {
      initialHours[day.date] = ''
    })
    return initialHours
  }, [weekDays])

  // Update week hours when week changes
  useEffect(() => {
    setWeekHours(initialWeekHours)
  }, [initialWeekHours])

  const handlePreviousWeek = () => {
    const newWeekStart = new Date(weekStart)
    newWeekStart.setDate(weekStart.getDate() - 7)
    setWeekStart(newWeekStart)
  }

  const handleNextWeek = () => {
    const newWeekStart = new Date(weekStart)
    newWeekStart.setDate(weekStart.getDate() + 7)
    setWeekStart(newWeekStart)
  }

  const handleHoursChange = (date: string, value: string) => {
    setWeekHours(prev => ({
      ...prev,
      [date]: value
    }))
  }

  const handleSubmit = () => {
    if (!selectedProject || totalHours === 0) return
    
    // Create ONE entry for the entire week with total hours
    // Use the week start date (Sunday) as the entry date
    const weekStartDate = weekDays[0].date
    
    // Build detailed notes showing hours breakdown by day
    const hourBreakdown = weekDays
      .filter(day => weekHours[day.date] && parseFloat(weekHours[day.date]) > 0)
      .map(day => `${day.dayName}: ${weekHours[day.date]}h`)
      .join(', ')
    
    const weeklyNotes = `Week ${formatWeekRange()}\n${hourBreakdown}${notes ? `\n\n${notes}` : ''}`

    onSubmit({
      projectId: selectedProject,
      taskId: selectedTask || undefined,
      date: weekStartDate,
      hours: totalHours,
      isBillable,
      notes: weeklyNotes,
    })

    // Reset form
    setSelectedProject('')
    setSelectedTask('')
    setWeekStart(getWeekStart(new Date()))
    setIsBillable(true)
    setNotes('')
  }

  const totalHours = Object.values(weekHours).reduce((sum, hours) => {
    return sum + (hours ? parseFloat(hours) : 0)
  }, 0)

  const hasAnyHours = Object.values(weekHours).some(hours => hours && parseFloat(hours) > 0)

  const formatWeekRange = () => {
    if (weekDays.length === 0) return ''
    const start = new Date(weekDays[0].date)
    const end = new Date(weekDays[6].date)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    if (start.getMonth() === end.getMonth()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
    } else {
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Weekly Time Entry</DialogTitle>
          <DialogDescription>Enter your working hours for the week</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Task (optional)</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask} disabled={!selectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/50">
            <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">{formatWeekRange()}</span>
            <Button variant="ghost" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekly Time Entry Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  {weekDays.map((day) => (
                    <th key={day.date} className="p-3 text-center border-r last:border-r-0">
                      <div className="text-xs font-medium text-muted-foreground">{day.dayName}</div>
                      <div className="text-sm font-semibold mt-1">{day.dayNumber}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {weekDays.map((day) => (
                    <td key={day.date} className="p-2 border-r last:border-r-0 border-t">
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        placeholder="0"
                        value={weekHours[day.date] || ''}
                        onChange={(e) => handleHoursChange(day.date, e.target.value)}
                        className="text-center"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Hours Display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="font-medium">Total Hours:</span>
            <span className="text-lg font-bold text-primary">{totalHours.toFixed(1)}h</span>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="billable-manual" checked={isBillable} onCheckedChange={(checked) => setIsBillable(checked as boolean)} />
            <Label htmlFor="billable-manual">Mark as billable</Label>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes for this week..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedProject || !hasAnyHours || isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Weekly Entry ({totalHours.toFixed(1)}h)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
