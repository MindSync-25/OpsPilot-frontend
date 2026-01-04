import { useState } from 'react'
import { UserRole } from '@/lib/roles'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MyLeaveRequests from '@/components/time/MyLeaveRequests'
import LeaveApprovals from '@/components/time/LeaveApprovals'

interface AbsenceProps {
  role: UserRole
}

export default function Absence({ role }: AbsenceProps) {
  const [activeTab, setActiveTab] = useState('my-requests')
  
  const isManager = role === UserRole.TOP_USER || role === UserRole.SUPER_USER || role === UserRole.ADMIN

  if (!isManager) {
    return (
      <div className="space-y-4">
        <MyLeaveRequests />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4">
          <TabsList className="inline-flex flex-row gap-1">
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="team-requests">Team Requests</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my-requests" className="mt-4">
          <MyLeaveRequests />
        </TabsContent>

        <TabsContent value="team-requests" className="mt-4">
          <LeaveApprovals role={role} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
