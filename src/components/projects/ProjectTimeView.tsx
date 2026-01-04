import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Clock, DollarSign, Calendar, Loader2, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { timeEntryService, type TimeEntry } from '@/services/timeEntryService'
import { formatDate } from '@/lib/time'

interface ProjectTimeViewProps {
  projectId: string
}

export function ProjectTimeView({ projectId }: ProjectTimeViewProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  
  // Fetch time entries for this project (all users for managers)
  const { data: timeEntries = [], isLoading } = useQuery<TimeEntry[]>({
    queryKey: ['timeEntries', projectId],
    queryFn: () => timeEntryService.getTimeEntries({ projectId }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  // Calculate totals
  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
  const billableHours = timeEntries.reduce((sum, entry) => 
    sum + (entry.isBillable ? (entry.hours || 0) : 0), 0
  )
  const nonBillableHours = totalHours - billableHours
  
  // Group by user
  const userStats = timeEntries.reduce((acc, entry) => {
    const userId = entry.userId
    const userName = entry.userName || 'Unknown User'
    if (!acc[userId]) {
      acc[userId] = {
        userId,
        userName,
        totalHours: 0,
        billableHours: 0,
        entries: []
      }
    }
    acc[userId].totalHours += entry.hours || 0
    acc[userId].billableHours += entry.isBillable ? (entry.hours || 0) : 0
    acc[userId].entries.push(entry)
    return acc
  }, {} as Record<string, { userId: string; userName: string; totalHours: number; billableHours: number; entries: TimeEntry[] }>)
  
  const userStatsList = Object.values(userStats).sort((a, b) => b.totalHours - a.totalHours)
  const uniqueUsers = userStatsList.length
  const avgHoursPerUser = uniqueUsers > 0 ? (totalHours / uniqueUsers).toFixed(1) : 0

  // Filter entries by selected user
  const filteredEntries = selectedUser 
    ? timeEntries.filter(e => e.userId === selectedUser)
    : timeEntries

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--accent-primary-weak)] rounded-lg">
                <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Hours</p>
                <p className="text-xl font-bold">{totalHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--accent-success)]/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-[var(--accent-success)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billable Hours</p>
                <p className="text-xl font-bold">{billableHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Non-Billable</p>
                <p className="text-xl font-bold">{nonBillableHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[var(--accent-primary-weak)] rounded-lg">
                <Users className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Team Members</p>
                <p className="text-xl font-bold">{uniqueUsers}</p>
                <p className="text-xs text-muted-foreground">{avgHoursPerUser}h avg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="entries" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="breakdown">User Breakdown</TabsTrigger>
        </TabsList>

        {/* Time Entries Tab */}
        <TabsContent value="entries" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
              <CardDescription>
                {selectedUser 
                  ? `Showing entries for ${userStats[selectedUser]?.userName || 'selected user'}`
                  : 'All time entries logged for this project'}
                {selectedUser && (
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="ml-2 text-[var(--accent-primary)] hover:underline text-sm"
                  >
                    Clear filter
                  </button>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No time entries found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.userName || 'Unknown'}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {entry.taskName || '-'}
                            </TableCell>
                            <TableCell className="font-medium">{entry.hours || 0}h</TableCell>
                            <TableCell>
                              {entry.isBillable ? (
                                <Badge variant="default">Billable</Badge>
                              ) : (
                                <Badge variant="secondary">Non-billable</Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {entry.description || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Breakdown Tab */}
        <TabsContent value="breakdown" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Time Breakdown</CardTitle>
              <CardDescription>Time logged by each team member</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : userStatsList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No user data available</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Total Hours</TableHead>
                        <TableHead className="text-right">Billable</TableHead>
                        <TableHead className="text-right">Non-Billable</TableHead>
                        <TableHead className="text-right">Efficiency</TableHead>
                        <TableHead className="text-right">Entries</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStatsList.map(user => {
                        const efficiency = user.totalHours > 0 
                          ? Math.round((user.billableHours / user.totalHours) * 100) 
                          : 0
                        return (
                          <TableRow key={user.userId}>
                            <TableCell className="font-medium">{user.userName}</TableCell>
                            <TableCell className="text-right">{user.totalHours}h</TableCell>
                            <TableCell className="text-right text-[var(--accent-success)]">
                              {user.billableHours}h
                            </TableCell>
                            <TableCell className="text-right text-gray-600 dark:text-gray-400">
                              {user.totalHours - user.billableHours}h
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={efficiency >= 70 ? "default" : "secondary"}>
                                {efficiency}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{user.entries.length}</TableCell>
                            <TableCell>
                              <button
                                onClick={() => {
                                  setSelectedUser(user.userId)
                                  // Switch to entries tab
                                  const entriesTab = document.querySelector('[value="entries"]') as HTMLElement
                                  entriesTab?.click()
                                }}
                                className="text-sm text-[var(--accent-primary)] hover:underline"
                              >
                                View entries
                              </button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
