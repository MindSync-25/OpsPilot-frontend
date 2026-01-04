import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, X, Trophy, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { useUserRole } from '@/hooks/useUserRole'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface OnboardingStep {
  id: string
  title: string
  description: string
  path: string
  checkCondition: (data: any) => boolean
}

export default function OnboardingChecklist() {
  const navigate = useNavigate()
  const { role } = useUserRole()
  const { shouldShowOnboarding, completedSteps, completeStep, dismissOnboarding, onboardingCompleted } = useOnboarding()

  // Fetch data to check completion status
  const { data: clients } = useQuery({ queryKey: ['clients'] })
  const { data: users } = useQuery({ queryKey: ['users'] })
  const { data: projects } = useQuery({ queryKey: ['projects'] })
  const { data: phases } = useQuery({ queryKey: ['phases'] })
  const { data: tasks } = useQuery({ queryKey: ['tasks'] })
  const { data: timeEntries } = useQuery({ queryKey: ['time-entries'] })
  const { data: crm } = useQuery({ queryKey: ['crm'] })
  const { data: invoices } = useQuery({ queryKey: ['invoices'] })

  const steps: OnboardingStep[] = [
    {
      id: 'client',
      title: 'Add your first client',
      description: 'Create a client to bill',
      path: '/app/clients',
      checkCondition: (data) => Array.isArray(data.clients) && data.clients.length > 0,
    },
    {
      id: 'team',
      title: 'Add your first team member',
      description: 'Build your team to collaborate',
      path: '/app/team',
      checkCondition: (data) => Array.isArray(data.users) && data.users.length > 1,
    },
    {
      id: 'project',
      title: 'Create your first project',
      description: 'Set up a client project',
      path: '/app/projects',
      checkCondition: (data) => Array.isArray(data.projects) && data.projects.length > 0,
    },
    {
      id: 'phase',
      title: 'Add project phases',
      description: 'Break down your project',
      path: '/app/projects',
      checkCondition: (data) => Array.isArray(data.phases) && data.phases.length > 0,
    },
    {
      id: 'task',
      title: 'Create your first task',
      description: 'Organize work with tasks',
      path: '/app/tasks',
      checkCondition: (data) => Array.isArray(data.tasks) && data.tasks.length > 0,
    },
    {
      id: 'time',
      title: 'Start time tracking',
      description: 'Log hours on your project',
      path: '/app/time',
      checkCondition: (data) => Array.isArray(data.timeEntries) && data.timeEntries.length > 0,
    },
    {
      id: 'crm',
      title: 'Track your first opportunity',
      description: 'Manage your sales pipeline',
      path: '/app/crm',
      checkCondition: (data) => Array.isArray(data.crm) && data.crm.length > 0,
    },
  ]

  // Add invoice step for non-USER roles
  if (role !== 'USER') {
    steps.push({
      id: 'invoice',
      title: 'Create your first invoice',
      description: 'Bill your clients',
      path: '/app/invoices',
      checkCondition: (data) => Array.isArray(data.invoices) && data.invoices.length > 0,
    })
  }

  // Auto-complete steps based on real data
  useEffect(() => {
    const data = { clients, users, projects, phases, tasks, timeEntries, crm, invoices }
    
    steps.forEach(step => {
      if (step.checkCondition(data) && !completedSteps.includes(step.id)) {
        completeStep(step.id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, users, projects, phases, tasks, timeEntries, crm, invoices])

  if (!shouldShowOnboarding && !onboardingCompleted) {
    return null
  }

  const completedCount = completedSteps.length
  const totalSteps = steps.length
  const progress = (completedCount / totalSteps) * 100

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {onboardingCompleted ? (
                <>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  You're all set! 🎉
                </>
              ) : (
                <>
                  Getting Started
                  <span className="text-xs font-normal text-muted-foreground">
                    {completedCount}/{totalSteps}
                  </span>
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {onboardingCompleted 
                ? 'You\'ve completed all onboarding steps!' 
                : 'Complete these steps to get the most out of OpsFlow'}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 -mt-1"
            onClick={dismissOnboarding}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Progress value={progress} className="mt-3 h-2" />
      </CardHeader>

      <CardContent className="space-y-2 pb-4">
        {steps.map((step) => {
          const isCompleted = completedSteps.includes(step.id)
          
          return (
            <button
              key={step.id}
              onClick={() => !isCompleted && navigate(step.path)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                isCompleted 
                  ? "bg-muted/50 border-muted cursor-default" 
                  : "bg-background border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>

              {!isCompleted && (
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
              )}
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
