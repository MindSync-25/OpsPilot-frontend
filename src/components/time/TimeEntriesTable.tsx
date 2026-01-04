import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { TimeEntry, UpdateTimeEntryRequest } from '@/services/timeEntryService'
import { formatDate } from '@/lib/time'

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

export function TimeEntriesTable({ entries, isLoading, onDelete }: TimeEntriesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return '-'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
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
              <TableHead>Date</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Billable</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(entry => (
              <TableRow key={entry.id}>
                <TableCell>{entry.date ? formatDate(entry.date) : '-'}</TableCell>
                <TableCell>{entry.projectName || 'Unknown'}</TableCell>
                <TableCell>{entry.taskName || '-'}</TableCell>
                <TableCell>{entry.hours || 0}h</TableCell>
                <TableCell>{entry.durationMinutes ? formatDuration(entry.durationMinutes) : '-'}</TableCell>
                <TableCell>
                  {entry.isBillable ? (
                    <Badge variant="default">Billable</Badge>
                  ) : (
                    <Badge variant="secondary">Non-billable</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {entry.isActive ? (
                    <Badge variant="outline" className="bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--border-subtle)]">Active</Badge>
                  ) : (
                    <Badge variant="outline">Stopped</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!entry.isActive && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(entry.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteId) {
                onDelete(deleteId)
                setDeleteId(null)
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
