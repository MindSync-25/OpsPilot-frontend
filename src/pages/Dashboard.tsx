import { Activity, FolderKanban, Clock, FileText, Plus, Users, Loader2, AlertCircle, CheckCircle2, Timer, TrendingUp, Target, Calendar, ArrowUpRight, ArrowDownRight, Zap, DollarSign, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import dashboardService from '@/services/dashboardService'
import { cn } from '@/lib/utils'
import OnboardingWelcomeModal from '@/components/onboarding/OnboardingWelcomeModal'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import { useOnboarding } from '@/contexts/OnboardingContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { shouldShowOnboarding, onboardingCompleted } = useOnboarding()
  
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getDashboardStats,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 60000, // Refetch every minute
  })

  if (isLoading) {
    return (
      <ContentSection>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </ContentSection>
    )
  }

  if (error || !stats) {
    return (
      <ContentSection>
        <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground">Failed to load dashboard data</p>
          </div>
        </div>
      </ContentSection>
    )
  }

  const weeklyHoursChange = stats.hoursLastWeek > 0 
    ? ((stats.hoursThisWeek - stats.hoursLastWeek) / stats.hoursLastWeek * 100).toFixed(1)
    : '0'
  
  const taskCompletionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0

  return (
    <ContentSection>
      {/* Onboarding Welcome Modal */}
      <OnboardingWelcomeModal />

      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's an overview of your workspace performance."
      />

      {/* Onboarding Checklist - Show if onboarding is active or just completed */}
      {(shouldShowOnboarding || onboardingCompleted) && (
        <div className="mb-6">
          <OnboardingChecklist />
        </div>
      )}

      {/* Main KPI Cards - Premium Density */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Projects */}
        <Card 
          className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate('/app/projects')}
        >
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.activeProjects}
                </p>
                <p className="mt-2 text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                  <span className="text-[var(--accent-success)] flex items-center">
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                  {stats.totalProjects} total projects
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl transition-all duration-300" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <FolderKanban className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>
              </div>
            </div>
            <div className="mt-3 h-1 w-full rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
              <div 
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000"
                style={{ width: `${(stats.activeProjects / stats.totalProjects) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Hours This Week */}
        <Card 
          className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          onClick={() => navigate('/app/time')}
        >
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                  Hours This Week
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.hoursThisWeek}h
                </p>
                <p className={cn(
                  "mt-2 text-xs font-medium flex items-center gap-1",
                  parseFloat(weeklyHoursChange) >= 0
                    ? 'text-[var(--accent-success)]'
                    : 'text-[var(--accent-danger)]'
                )}>
                  {parseFloat(weeklyHoursChange) >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {parseFloat(weeklyHoursChange) >= 0 ? '+' : ''}{weeklyHoursChange}% vs last week
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl transition-all duration-300" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <Clock className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>
              </div>
            </div>
            <div className="mt-3 h-1 w-full rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
              <div 
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((stats.hoursThisWeek / 40) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals / My Pending Requests */}
        <Card 
          className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          onClick={() => {
            const isManager = ['TOP_USER', 'SUPER_USER'].includes(localStorage.getItem('userRole') || '');
            navigate(isManager ? '/app/time?tab=timesheets&subtab=approvals' : '/app/time?tab=timesheets');
          }}
        >
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                  {['TOP_USER', 'SUPER_USER'].includes(localStorage.getItem('userRole') || '') ? 'Pending Approvals' : 'My Pending Requests'}
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.pendingTimesheets}
                </p>
                <p className="mt-2 text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[var(--accent-primary)]" />
                  {['TOP_USER', 'SUPER_USER'].includes(localStorage.getItem('userRole') || '') ? 'Awaiting review' : 'Awaiting approval'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl transition-all duration-300" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <FileText className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>
              </div>
            </div>
            {stats.pendingTimesheets > 0 && (
              <div className="mt-3 px-2.5 py-1 bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/20 rounded-lg">
                <p className="text-xs font-medium text-[var(--accent-warning)]">
                  Action required
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card 
          className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
          onClick={() => navigate('/app/team')}
        >
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                  Active Team
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.activeTeamMembers}
                </p>
                <p className="mt-2 text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stats.teamMembers} total members
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 rounded-xl transition-all duration-300" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <Users className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>
              </div>
            </div>
            <div className="mt-3 h-1 w-full rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
              <div 
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000"
                style={{ width: `${(stats.activeTeamMembers / stats.teamMembers) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Row - Premium Density */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Project Status Breakdown */}
        <Card 
          className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate('/app/projects')}
        >
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <Target className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                Project Status
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {stats.totalProjects} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            <div className="space-y-2">
              <div className="group p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">In Progress</span>
                  <Badge variant="outline" className="text-xs">{stats.activeProjects}</Badge>
                </div>
                <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
                  <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" style={{ width: `${(stats.activeProjects / stats.totalProjects) * 100}%` }} />
                </div>
              </div>
              
              <div className="group p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Planning</span>
                  <Badge variant="outline" className="text-xs">{stats.planningProjects}</Badge>
                </div>
                <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
                  <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" style={{ width: `${(stats.planningProjects / stats.totalProjects) * 100}%` }} />
                </div>
              </div>
              
              <div className="group p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">On Hold</span>
                  <Badge className="bg-[var(--accent-warning)] text-white text-xs">{stats.onHoldProjects}</Badge>
                </div>
                <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
                  <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" style={{ width: `${(stats.onHoldProjects / stats.totalProjects) * 100}%` }} />
                </div>
              </div>
              
              <div className="group p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Completed</span>
                  <Badge className="bg-[var(--accent-success)] text-white text-xs">{stats.completedProjects}</Badge>
                </div>
                <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
                  <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" style={{ width: `${(stats.completedProjects / stats.totalProjects) * 100}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Overview */}
        <Card 
          className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate('/app/tasks')}
        >
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                Task Overview
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {stats.totalTasks} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Completion Rate</span>
                <span className="text-xl font-bold text-[var(--accent-primary)]">
                  {taskCompletionRate}%
                </span>
              </div>
              <div className="relative h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
                <div 
                  className="absolute inset-y-0 left-0 bg-[var(--accent-primary)] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${taskCompletionRate}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-success)]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Completed</span>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">{stats.completedTasks}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">In Progress</span>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">{stats.inProgressTasks}</span>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">To Do</span>
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)]">{stats.todoTasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking Summary */}
        <Card 
          className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300 cursor-pointer"
          onClick={() => navigate('/app/time')}
        >
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <Timer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                Time Tracking
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {stats.totalHoursLogged}h
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="relative p-3 rounded-lg border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Billable Hours</span>
                <DollarSign className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--accent-primary)]">
                {stats.billableHours}h
              </p>
              <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: 'var(--accent-primary-weak)' }}>
                <div 
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-1000"
                  style={{ width: `${(stats.billableHours / stats.totalHoursLogged) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <span className="text-xs font-medium text-[var(--text-muted)]">Non-Billable</span>
                <span className="text-xs font-bold text-[var(--text-secondary)]">{stats.nonBillableHours}h</span>
              </div>
              
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Billable Rate</span>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span className="text-base font-bold text-[var(--accent-primary)]">
                      {stats.totalHoursLogged > 0
                        ? Math.round((stats.billableHours / stats.totalHoursLogged) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Projects and Upcoming Deadlines - Premium Density */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Projects by Hours */}
        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                Top Projects by Hours
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                This Week
              </Badge>
            </div>
            <CardDescription className="text-xs text-[var(--text-muted)]">Most time-intensive projects</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.topProjectsByHours.length > 0 ? (
              <div className="space-y-2">
                {stats.topProjectsByHours.map((project, index) => (
                  <div
                    key={project.id}
                    className="group relative p-3 rounded-lg hover:bg-accent/50 transition-all duration-300 border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 cursor-pointer"
                    onClick={() => navigate(`/app/projects/${project.id}`)}
                  >
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-[var(--accent-primary)] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-[var(--accent-primary)]">
                            #{index + 1}
                          </div>
                          <h3 className="text-sm font-semibold truncate text-[var(--text-primary)]">{project.name}</h3>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            <Clock className="w-3 h-3 text-[var(--accent-primary)]" />
                            <span className="font-semibold text-[var(--text-primary)]">{project.hours}h</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            <DollarSign className="w-3 h-3 text-[var(--accent-success)]" />
                            <span className="font-semibold text-[var(--accent-success)]">{project.billableHours}h</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 ml-2">
                        <Badge variant={
                          project.status === 'COMPLETED' ? 'default' :
                          project.status === 'IN_PROGRESS' ? 'secondary' :
                          'outline'
                        } className="text-xs">
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No project time entries yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
                  <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
                Upcoming Deadlines
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                Next 7 Days
              </Badge>
            </div>
            <CardDescription className="text-xs text-[var(--text-muted)]">Tasks and projects due soon</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {stats.upcomingDeadlines.length > 0 ? (
              <div className="space-y-2">
                {stats.upcomingDeadlines.slice(0, 5).map((deadline) => {
                  const isUrgent = deadline.daysRemaining <= 3;
                  const isWarning = deadline.daysRemaining > 3 && deadline.daysRemaining <= 7;
                  
                  return (
                    <div
                      key={`${deadline.type}-${deadline.id}`}
                      className="group relative p-3 rounded-lg transition-all duration-300 border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/30 hover:bg-accent/30 cursor-pointer"
                      onClick={() => {
                        if (deadline.type === 'TASK') {
                          navigate(`/app/tasks/${deadline.id}`);
                        } else if (deadline.type === 'PROJECT') {
                          navigate(`/app/projects/${deadline.id}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className="text-xs">
                              {deadline.type}
                            </Badge>
                            <h3 className="text-sm font-semibold truncate text-[var(--text-primary)]">{deadline.name}</h3>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {new Date(deadline.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5 ml-2">
                          <Badge 
                            className={cn(
                              "text-xs font-bold text-white",
                              isUrgent && "bg-[var(--accent-danger)]",
                              isWarning && "bg-[var(--accent-warning)]",
                              !isUrgent && !isWarning && "bg-[var(--accent-primary)]"
                            )}
                          >
                            {isUrgent && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                            {deadline.daysRemaining} {deadline.daysRemaining === 1 ? 'day' : 'days'}
                          </Badge>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No upcoming deadlines</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Premium Density */}
      <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
              <Zap className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            </div>
            <CardTitle className="text-sm font-bold">Quick Actions</CardTitle>
          </div>
          <CardDescription className="text-xs text-[var(--text-muted)]">Common tasks to get started quickly</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              onClick={() => navigate('/app/projects')}
              className="group relative overflow-hidden flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] p-3 text-left hover:border-[var(--accent-primary)]/40 hover:bg-accent/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0 relative z-10">
                <div className="p-2 rounded-lg text-white bg-[var(--accent-primary)] group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Create Project</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">Start a new project</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 absolute top-3 right-3 text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={() => navigate('/app/clients')}
              className="group relative overflow-hidden flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] p-3 text-left hover:border-[var(--accent-primary)]/40 hover:bg-accent/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0 relative z-10">
                <div className="p-2 rounded-lg text-white bg-[var(--accent-primary)] group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Add Client</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">Register new client</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 absolute top-3 right-3 text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            
            <button
              onClick={() => navigate('/app/time')}
              className="group relative overflow-hidden flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] p-3 text-left hover:border-[var(--accent-primary)]/40 hover:bg-accent/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0 relative z-10">
                <div className="p-2 rounded-lg text-white bg-[var(--accent-primary)] group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">Log Time</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">Track your hours</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 absolute top-3 right-3 text-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Premium Density */}
      <Card className="rounded-xl border border-[var(--border-subtle)] shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-shadow duration-300">
        <CardHeader className="pb-2 px-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-soft)' }}>
              <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            </div>
            <CardTitle className="text-sm font-bold">Recent Activity</CardTitle>
          </div>
          <CardDescription className="text-xs text-[var(--text-muted)]">Latest updates across your workspace</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentActivities.length > 0 ? (
            <div className="divide-y divide-[var(--border-subtle)]">
              {stats.recentActivities.map((activity, index) => (
                <div 
                  key={`${activity.type}-${activity.id}`} 
                  className="group px-4 py-3 hover:bg-accent/50 transition-all duration-300 relative cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => {
                    if (activity.type === 'TASK') {
                      navigate(`/app/tasks/${activity.id}`);
                    } else if (activity.type === 'PROJECT') {
                      navigate(`/app/projects/${activity.id}`);
                    } else if (activity.type === 'TIMESHEET') {
                      navigate(`/app/time/timesheets/${activity.id}`);
                    } else if (activity.type === 'CLIENT') {
                      navigate('/app/clients');
                    } else if (activity.type === 'TEAM') {
                      navigate('/app/team');
                    }
                  }}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs font-semibold"
                        >
                          {activity.type}
                        </Badge>
                        <h3 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">
                          {activity.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-1.5">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Users className="w-3 h-3" />
                          <span className="font-medium">{activity.userName}</span>
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">•</span>
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Clock className="w-3 h-3" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 text-[var(--text-muted)]">
              <Activity className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-medium">No recent activity</p>
              <p className="text-xs mt-1">Activity will appear here as your team works</p>
            </div>
          )}
        </CardContent>
      </Card>
    </ContentSection>
  )
}
