import { Activity, DollarSign, FolderKanban, Clock, FileText, Plus, Users, Receipt } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/common/PageHeader'
import ContentSection from '@/components/common/ContentSection'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const kpiData = [
  {
    name: 'Active Projects',
    value: '12',
    icon: FolderKanban,
    change: '+2 this week',
    changeType: 'positive' as const,
  },
  {
    name: 'Hours This Week',
    value: '127',
    icon: Clock,
    change: '+8% from last week',
    changeType: 'positive' as const,
  },
  {
    name: 'Unpaid Invoices',
    value: '5',
    icon: FileText,
    change: '-2 from last month',
    changeType: 'positive' as const,
  },
  {
    name: 'Revenue This Month',
    value: '$24,500',
    icon: DollarSign,
    change: '+12% from last month',
    changeType: 'positive' as const,
  },
]

const recentActivities = [
  {
    id: 1,
    type: 'project',
    title: 'New project created',
    description: 'Website Redesign for Acme Corp',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'invoice',
    title: 'Invoice paid',
    description: 'Invoice #1234 - $5,000',
    time: '5 hours ago',
  },
  {
    id: 3,
    type: 'team',
    title: 'Team member added',
    description: 'Sarah Johnson joined the team',
    time: '1 day ago',
  },
  {
    id: 4,
    type: 'client',
    title: 'New client',
    description: 'TechStart Inc. added to clients',
    time: '2 days ago',
  },
  {
    id: 5,
    type: 'project',
    title: 'Project completed',
    description: 'Mobile App Development finished',
    time: '3 days ago',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  // Split revenue (hero) from other KPIs
  const revenueKpi = kpiData.find(kpi => kpi.name === 'Revenue This Month')!
  const otherKpis = kpiData.filter(kpi => kpi.name !== 'Revenue This Month')

  return (
    <ContentSection>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your projects."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
        {/* Hero Revenue Card - spans 2 columns */}
        <Card className="sm:col-span-2 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wide">
                  {revenueKpi.name}
                </p>
                <p className="mt-3 text-5xl font-extrabold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {revenueKpi.value}
                </p>
                <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400">
                  {revenueKpi.change}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-4 bg-primary/10 rounded-xl">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other KPI Cards */}
        {otherKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.name} className="sm:col-span-1 lg:col-span-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wide">
                      {kpi.name}
                    </p>
                    <p className="mt-2 text-3xl font-bold">
                      {kpi.value}
                    </p>
                    <p
                      className={`mt-2 text-xs font-medium ${
                        kpi.changeType === 'positive'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {kpi.change}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border/60" />
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              onClick={() => navigate('/app/projects')}
              className="group relative flex items-start gap-4 rounded-lg border border-border bg-card p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary/70 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Create Project</div>
                <div className="mt-1 text-xs text-muted-foreground/80">Start a new project</div>
              </div>
            </button>
            <button
              onClick={() => navigate('/app/clients')}
              className="group relative flex items-start gap-4 rounded-lg border border-border bg-card p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary/70 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Add Client</div>
                <div className="mt-1 text-xs text-muted-foreground/80">Register new client</div>
              </div>
            </button>
            <button
              onClick={() => navigate('/app/invoices')}
              className="group relative flex items-start gap-4 rounded-lg border border-border bg-card p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary/70 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Create Invoice</div>
                <div className="mt-1 text-xs text-muted-foreground/80">Generate new invoice</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Section Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border/60" />
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-muted-foreground/70" />
            <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-accent/30 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {activity.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground/80">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ContentSection>
  )
}
