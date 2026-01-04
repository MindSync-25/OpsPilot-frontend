import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ContentSection from '@/components/common/ContentSection'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserRole } from '@/hooks/useUserRole'
import TimeEntries from '@/components/time/TimeEntries'
import MyTimesheet from '@/components/time/MyTimesheet'
import TimesheetApprovals from '@/components/time/TimesheetApprovals'
import MyLeaveRequests from '@/components/time/MyLeaveRequests'
import LeaveApprovals from '@/components/time/LeaveApprovals'
import { UserRole } from '@/lib/roles'
import { cn } from '@/lib/utils'
import OnboardingTooltip from '@/components/onboarding/OnboardingTooltip'
import { useOnboarding } from '@/contexts/OnboardingContext'

export default function TimeTracking() {
  const { role } = useUserRole()
  const [searchParams] = useSearchParams()
  const { shouldShowOnboarding, completedSteps } = useOnboarding()
  
  // Initialize state from URL query parameters
  const urlTab = searchParams.get('tab')
  const urlSubtab = searchParams.get('subtab')
  
  const [activeTab, setActiveTab] = useState(urlTab || 'entries')
  const [timesheetTab, setTimesheetTab] = useState(
    urlTab === 'timesheets' && urlSubtab === 'approvals' ? 'approvals' : 'my-timesheet'
  )
  const [absenceTab, setAbsenceTab] = useState(
    urlTab === 'absence' && urlSubtab === 'approvals' ? 'team-requests' : 'my-requests'
  )
  
  const isManager = role === UserRole.TOP_USER || role === UserRole.SUPER_USER || role === UserRole.ADMIN

  return (
    <ContentSection>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage your time, timesheets, and leave requests</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative">
              <TabsList>
                <TabsTrigger value="entries">Entries</TabsTrigger>
                <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
                <TabsTrigger value="absence">Absence</TabsTrigger>
              </TabsList>
              {shouldShowOnboarding && !completedSteps.includes('time') && activeTab === 'entries' && (
                <OnboardingTooltip
                  stepId="time-entries"
                  title="Track Your Time"
                  description="Click the 'Start Timer' button or add time entries manually to log your work hours."
                  position="bottom"
                />
              )}
            </div>

            {activeTab === 'timesheets' && isManager && (
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <button
                  onClick={() => setTimesheetTab('my-timesheet')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    timesheetTab === 'my-timesheet' 
                      ? 'bg-background text-foreground shadow' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  My Timesheet
                </button>
                <button
                  onClick={() => setTimesheetTab('approvals')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    timesheetTab === 'approvals' 
                      ? 'bg-background text-foreground shadow' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Approvals
                </button>
              </div>
            )}

            {activeTab === 'absence' && isManager && (
              <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <button
                  onClick={() => setAbsenceTab('my-requests')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    absenceTab === 'my-requests' 
                      ? 'bg-background text-foreground shadow' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  My Requests
                </button>
                <button
                  onClick={() => setAbsenceTab('team-requests')}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    absenceTab === 'team-requests' 
                      ? 'bg-background text-foreground shadow' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Team Requests
                </button>
              </div>
            )}
          </div>

          <TabsContent value="entries" className="mt-4">
            <TimeEntries />
          </TabsContent>

          <TabsContent value="timesheets" className="mt-4">
            {!isManager ? (
              <MyTimesheet />
            ) : (
              <>
                {timesheetTab === 'my-timesheet' && <MyTimesheet />}
                {timesheetTab === 'approvals' && <TimesheetApprovals role={role as any} />}
              </>
            )}
          </TabsContent>

          <TabsContent value="absence" className="mt-4">
            {!isManager ? (
              <MyLeaveRequests />
            ) : (
              <>
                {absenceTab === 'my-requests' && <MyLeaveRequests />}
                {absenceTab === 'team-requests' && <LeaveApprovals role={role as any} />}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ContentSection>
  )
}
