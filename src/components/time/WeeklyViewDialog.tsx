import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { TimeEntry } from '@/services/timeEntryService'

interface WeeklyViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekEntries: (TimeEntry & { projectName?: string; taskName?: string })[]
  weekStart: Date
}

interface WeekDay {
  date: string
  dayName: string
  dayNumber: number
  hours: number
  isBillable?: boolean
}

export function WeeklyViewDialog({ open, onOpenChange, weekEntries, weekStart }: WeeklyViewDialogProps) {
  // Generate week days array
  const weekDays: WeekDay[] = []
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Find entry for this date
    const entry = weekEntries.find(e => e.date === dateStr)
    
    weekDays.push({
      date: dateStr,
      dayName: dayNames[i],
      dayNumber: date.getDate(),
      hours: entry?.hours || 0,
      isBillable: entry?.isBillable
    })
  }

  const formatWeekRange = () => {
    const start = new Date(weekStart)
    const end = new Date(weekStart)
    end.setDate(start.getDate() + 6)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    if (start.getMonth() === end.getMonth()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
    } else {
      return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`
    }
  }

  const totalHours = weekDays.reduce((sum, day) => sum + day.hours, 0)
  const projectName = weekEntries[0]?.projectName || 'N/A'
  const taskName = weekEntries[0]?.taskName || 'N/A'
  const notes = weekEntries.find(e => e.description)?.description || '-'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Weekly Time Entry</DialogTitle>
          <DialogDescription>{formatWeekRange()}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Project and Task Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Project</p>
              <p className="font-medium">{projectName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Task</p>
              <p className="font-medium">{taskName}</p>
            </div>
          </div>

          {/* Weekly Time Entry Table (Read-only) */}
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
                    <td key={day.date} className="p-3 border-r last:border-r-0 border-t text-center">
                      {day.hours > 0 ? (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-primary">{day.hours}h</div>
                          {day.isBillable !== undefined && (
                            <Badge 
                              variant={day.isBillable ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {day.isBillable ? 'Billable' : 'Non-billable'}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
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

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Notes</p>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{notes}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
