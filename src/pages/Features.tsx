import { Link } from 'react-router-dom';
import { 
  FolderKanban, Clock, FileText, Users, BarChart3, Shield, 
  Zap, Calendar, DollarSign, Bell, CheckSquare, MessageSquare,
  ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MarketingLayout from '@/components/marketing/MarketingLayout';

const features = [
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Organize projects with phases, milestones, and Kanban boards. Track progress and manage dependencies.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    features: [
      'Multi-phase project organization',
      'Kanban board with drag & drop',
      'Project templates',
      'Milestone tracking',
      'File attachments'
    ]
  },
  {
    icon: Clock,
    title: 'Time Tracking',
    description: 'Track billable and non-billable hours with automated timesheets. Export time reports for invoicing.',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    features: [
      'Manual and automatic time entries',
      'Timesheet management',
      'Billable hours tracking',
      'Time reports by project/user',
      'Calendar integration'
    ]
  },
  {
    icon: FileText,
    title: 'Invoicing & Billing',
    description: 'Generate professional invoices with automated billing. Accept payments via Razorpay integration.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    features: [
      'Auto-invoice generation',
      'Razorpay payment gateway',
      'Subscription management',
      'Invoice templates',
      'Payment tracking'
    ]
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Manage team members with role-based permissions. Assign tasks and track team performance.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    features: [
      'Role-based access control',
      'Team hierarchy',
      'User permissions',
      'Activity tracking',
      'Team analytics'
    ]
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Get actionable insights with comprehensive dashboards and customizable reports.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900',
    features: [
      'Real-time dashboards',
      'Custom reports',
      'Project analytics',
      'Revenue tracking',
      'Export to CSV/PDF'
    ]
  },
  {
    icon: Shield,
    title: 'CRM & Client Management',
    description: 'Manage client relationships, track communications, and maintain detailed client profiles.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900',
    features: [
      'Client profiles',
      'Communication history',
      'Deal pipeline',
      'Contact management',
      'Custom fields'
    ]
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Create, assign, and track tasks with subtasks, priorities, and custom workflows.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900',
    features: [
      'Task creation & assignment',
      'Subtasks & checklists',
      'Priority levels',
      'Due dates & reminders',
      'Task dependencies'
    ]
  },
  {
    icon: Calendar,
    title: 'Leave Management',
    description: 'Handle time-off requests, track leave balances, and manage team availability.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    features: [
      'Leave request workflow',
      'Approval system',
      'Leave balance tracking',
      'Calendar view',
      'Holiday management'
    ]
  },
  {
    icon: Bell,
    title: 'Real-time Notifications',
    description: 'Stay updated with instant notifications for tasks, comments, and project updates.',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    features: [
      'In-app notifications',
      'Email alerts',
      'Custom notification rules',
      'Activity feed',
      'Notification preferences'
    ]
  },
  {
    icon: MessageSquare,
    title: 'Collaboration Tools',
    description: 'Communicate effectively with comments, mentions, and team discussions.',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900',
    features: [
      'Task comments',
      '@mentions',
      'File sharing',
      'Activity streams',
      'Team chat'
    ]
  },
  {
    icon: DollarSign,
    title: 'Subscription Management',
    description: 'Flexible pricing plans with automated billing and usage-based limits.',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900',
    features: [
      'Multiple pricing tiers',
      'Usage limits enforcement',
      'Billing cycle management',
      'Upgrade/downgrade',
      'Trial periods'
    ]
  },
  {
    icon: Zap,
    title: 'Automation & Workflows',
    description: 'Automate repetitive tasks and create custom workflows to boost productivity.',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900',
    features: [
      'Automated invoicing',
      'Recurring tasks',
      'Workflow templates',
      'Custom triggers',
      'Integration webhooks'
    ]
  }
];

export default function Features() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Powerful Features for Modern Teams
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Everything you need to manage IT operations, track time, collaborate with teams, and grow your business.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-start text-sm text-slate-600 dark:text-slate-400">
                      <CheckSquare className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Start your 14-day free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
