import { useState, useMemo } from 'react'
import { Trash2, Loader2, Eye, Calendar } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { TimeEntry, UpdateTimeEntryRequest } from '@/services/timeEntryService'
import { WeeklyViewDialog } from './WeeklyViewDialog'

type EnrichedTimeEntry = TimeEntry & {
  projectName?: string
  taskName?: string
}

interface TimeEntriesTableProps {
  entries: EnrichedTimeEntry[]
  isLoading: boolean
  onUpdate: (id: string, payload: UpdateTimeEntryRequest) => void
  onDelete: (id: string) => void
  role: string
}

interface WeekGroup {
  weekStart: Date
  weekEnd: Date
  entries: EnrichedTimeEntry[]
  totalHours: number
  projects: string[]
}

export function TimeEntriesTable({ entries, isLoading, onDelete }: TimeEntriesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<WeekGroup | null>(null)

  // Get week start (Sunday) for a given date
  const getWeekStart = (dateStr: string): Date => {
    const date = new Date(dateStr)
    const day = date.getDay()
    const diff = date.getDate() - day
    return new Date(date.setDate(diff))
  }

  // Group entries by week
  const weekGroups = useMemo(() => {
    const groups = new Map<string, WeekGroup>()
    
    entries.forEach(entry => {
      if (!entry.date) return
      
      const weekStart = getWeekStart(entry.date)
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!groups.has(weekKey)) {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        groups.set(weekKey, {
          weekStart,
          weekEnd,
          entries: [],
          totalHours: 0,
          projects: []
        })
      }
      
      const group = groups.get(weekKey)!
      group.entries.push(entry)
      group.totalHours += entry.hours || 0
      
      if (entry.projectName && !group.projects.includes(entry.projectName)) {
        group.projects.push(entry.projectName)
      }
    })
    
    // Sort by week start date (most recent first)
    return Array.from(groups.values()).sort((a, b) => 
      b.weekStart.getTime() - a.weekStart.getTime()
    )
  }, [entries])

  const formatWeekRange = (weekStart: Date, weekEnd: Date) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`
    } else {
      return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`
    }
  }

  const handleDeleteWeek = (weekGroup: WeekGroup) => {
    // Delete all entries in the week
    weekGroup.entries.forEach(entry => {
      onDelete(entry.id)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (weekGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No time entries found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Calendar className="h-4 w-4" />
              </TableHead>
              <TableHead>Week Period</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Total Hours</TableHead>
              <TableHead>Days Worked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weekGroups.map((weekGroup, index) => (
              <TableRow 
                key={index} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedWeek(weekGroup)}
              >
                <TableCell>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatWeekRange(weekGroup.weekStart, weekGroup.weekEnd)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {weekGroup.projects.slice(0, 2).map((project, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {project}
                      </Badge>
                    ))}
                    {weekGroup.projects.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{weekGroup.projects.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-lg font-bold text-primary">
                    {weekGroup.totalHours.toFixed(1)}h
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {weekGroup.entries.length} {weekGroup.entries.length === 1 ? 'day' : 'days'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedWeek(weekGroup)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDeleteId(weekGroup.weekStart.toISOString())}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Weekly View Dialog */}
      {selectedWeek && (
        <WeeklyViewDialog
          open={!!selectedWeek}
          onOpenChange={(open) => !open && setSelectedWeek(null)}
          weekEntries={selectedWeek.entries}
          weekStart={selectedWeek.weekStart}
        />
      )}

      {/* Delete Week Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Week Entries</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all time entries for this week? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteId) {
                const weekGroup = weekGroups.find(w => w.weekStart.toISOString() === deleteId)
                if (weekGroup) {
                  handleDeleteWeek(weekGroup)
                }
                setDeleteId(null)
              }
            }}>
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
