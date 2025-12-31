import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import type { StartTimerRequest } from '@/services/timeEntryService'
import type { Project } from '@/services/projectService'
import type { Task } from '@/services/taskService'

interface StartTimerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: StartTimerRequest) => void
  isLoading: boolean
  projects: Project[]
  tasks: Task[]
}

export function StartTimerDialog({ open, onOpenChange, onSubmit, isLoading, projects, tasks }: StartTimerDialogProps) {
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTask, setSelectedTask] = useState<string>('')
  const [isBillable, setIsBillable] = useState(true)
  const [notes, setNotes] = useState('')

  const filteredTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject) : []

  const handleSubmit = () => {
    if (!selectedProject) return
    onSubmit({
      projectId: selectedProject,
      taskId: selectedTask || undefined,
      isBillable,
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Timer</DialogTitle>
          <DialogDescription>Start tracking time for a project and task</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
          <div className="flex items-center space-x-2">
            <Checkbox id="billable" checked={isBillable} onCheckedChange={(checked) => setIsBillable(checked as boolean)} />
            <Label htmlFor="billable">Billable</Label>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedProject || isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start Timer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
