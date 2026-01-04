import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Calendar, Loader2 } from 'lucide-react'
import ContentSection from '@/components/common/ContentSection'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMyLeaveRequest, type CreateLeaveRequest, type LeaveType } from '@/services/leaveService'

export default function LeaveRequestPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<CreateLeaveRequest>({
    startDate: '',
    endDate: '',
    type: 'PTO',
    reason: '',
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateLeaveRequest) => createMyLeaveRequest(payload),
    onSuccess: () => {
      toast.success('Leave request submitted successfully')
      queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] })
      navigate('/app/time?tab=absence')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to create leave request')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates')
      return
    }
    
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (start < today) {
      toast.error('Start date cannot be in the past')
      return
    }
    
    if (end < start) {
      toast.error('End date must be on or after start date')
      return
    }

    createMutation.mutate(formData)
  }

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <ContentSection>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Request Leave</h1>
            <p className="text-muted-foreground mt-1">Submit a new leave request for approval</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="p-4">
            <div className="space-y-6">
              {/* Date Range Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Leave Period
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-base">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="text-base h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-base">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="text-base h-11"
                    />
                  </div>
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="p-4 bg-[var(--accent-primary-weak)] rounded-lg">
                    <p className="text-sm font-medium">
                      Duration: <span className="text-[var(--accent-primary)]">{calculateDays()} day(s)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      From {new Date(formData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to {new Date(formData.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Leave Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-base">
                  Leave Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as LeaveType })}
                >
                  <SelectTrigger id="type" className="text-base h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PTO">PTO (Paid Time Off)</SelectItem>
                    <SelectItem value="SICK">Sick Leave</SelectItem>
                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                    <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select the type of leave you're requesting
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-base">
                  Reason / Notes
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Provide details about your leave request. Include any important information your manager should know..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={6}
                  className="text-base resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Optional - Add any additional context or details
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Leave Request
                </Button>
              </div>
            </div>
          </Card>
        </form>

        {/* Info Card */}
        <Card className="p-4 bg-muted/50">
          <h4 className="font-semibold mb-2">Important Information</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Your leave request will be sent to your manager for approval</li>
            <li>• You'll be notified once your request is reviewed</li>
            <li>• You can cancel pending requests from the Absence tab</li>
            <li>• Make sure to coordinate with your team before submitting</li>
          </ul>
        </Card>
      </div>
    </ContentSection>
  )
}
