import { useState } from 'react'
import { UserRole } from '@/lib/roles'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MyTimesheet from '@/components/time/MyTimesheet'
import TimesheetApprovals from '@/components/time/TimesheetApprovals'

interface TimesheetsProps {
  role: UserRole
}

export default function Timesheets({ role }: TimesheetsProps) {
  const [activeTab, setActiveTab] = useState('my-timesheet')
  
  const isManager = role === UserRole.TOP_USER || role === UserRole.SUPER_USER || role === UserRole.ADMIN

  if (!isManager) {
    return (
      <div className="space-y-4">
        <MyTimesheet />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4">
          <TabsList className="inline-flex flex-row gap-1">
            <TabsTrigger value="my-timesheet">My Timesheet</TabsTrigger>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my-timesheet" className="mt-4">
          <MyTimesheet />
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <TimesheetApprovals role={role} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
