import Crm from '@/pages/Crm.tsx'
import CrmDetailPage from '@/pages/CrmDetailPage.tsx'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store'
import AppShell from '@/components/layout/AppShell'
import { RoleGuard, RouteGuard } from '@/components/guards/RoleGuard'
import { UserRole } from '@/lib/roles'
import Login from '@/pages/Login.tsx'
import Signup from '@/pages/Signup.tsx'
import Dashboard from '@/pages/Dashboard.tsx'
import Projects from '@/pages/Projects.tsx'
import ProjectDetail from '@/pages/ProjectDetail.tsx'
import PhaseDetailPage from '@/pages/PhaseDetailPage.tsx'
import TaskDetailPage from '@/pages/TaskDetailPage.tsx'
import SubtaskDetailPage from '@/pages/SubtaskDetailPage.tsx'
import TasksNew from '@/pages/TasksNew.tsx'
import Clients from '@/pages/Clients.tsx'
import ClientDetail from '@/pages/ClientDetail.tsx'
import TeamNew from '@/pages/TeamNew.tsx'
import TimeTracking from '@/pages/TimeTracking.tsx'
import TimesheetDetailPage from '@/pages/TimesheetDetailPage.tsx'
import LeaveRequestPage from '@/pages/LeaveRequestPage.tsx'
import Invoices from '@/pages/Invoices.tsx'
import Reports from '@/pages/Reports.tsx'
import AdvancedAnalytics from '@/pages/AdvancedAnalytics.tsx'
import WhiteLabel from '@/pages/WhiteLabel.tsx'
import Settings from '@/pages/Settings.tsx'
import Billing from '@/pages/Billing.tsx'
import Pricing from '@/pages/Pricing.tsx'
import Home from '@/pages/Home.tsx'
import Features from '@/pages/Features.tsx'
import About from '@/pages/About.tsx'

// Protected route wrapper
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <AppShell><Outlet /></AppShell>
}

// Public route wrapper (redirect to dashboard if already logged in for auth pages only)
const PublicRoute = () => {
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicRoute />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'features',
        element: <Features />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'pricing',
        element: <Pricing />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <Signup />,
      },
    ],
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'projects',
        element: (
          <RouteGuard path="/app/projects">
            <Projects />
          </RouteGuard>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <RouteGuard path="/app/projects">
            <ProjectDetail />
          </RouteGuard>
        ),
      },
      {
        path: 'projects/:projectId/phases/:phaseId',
        element: (
          <RouteGuard path="/app/projects">
            <PhaseDetailPage />
          </RouteGuard>
        ),
      },
      {
        path: 'projects/:projectId/tasks/:taskId',
        element: (
          <RouteGuard path="/app/projects">
            <TaskDetailPage />
          </RouteGuard>
        ),
      },
      {
        path: 'projects/:projectId/tasks/:taskId/subtasks/:subtaskId',
        element: (
          <RouteGuard path="/app/projects">
            <SubtaskDetailPage />
          </RouteGuard>
        ),
      },
      {
        path: 'tasks',
        element: (
          <RouteGuard path="/app/tasks">
            <TasksNew />
          </RouteGuard>
        ),
      },
      {
        path: 'tasks/:taskId',
        element: (
          <RouteGuard path="/app/tasks">
            <TaskDetailPage />
          </RouteGuard>
        ),
      },
      {
        path: 'clients',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER]}>
            <Clients />
          </RoleGuard>
        ),
      },
      {
        path: 'crm',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER]}>
            <Crm />
          </RoleGuard>
        ),
      },
      {
        path: 'crm/:id',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER]}>
            <CrmDetailPage />
          </RoleGuard>
        ),
      },
      {
        path: 'clients/:id',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER]}>
            <ClientDetail />
          </RoleGuard>
        ),
      },
      {
        path: 'team',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER]}>
            <TeamNew />
          </RoleGuard>
        ),
      },
      {
        path: 'time',
        element: (
          <RouteGuard path="/app/time">
            <TimeTracking />
          </RouteGuard>
        ),
      },
      {
        path: 'time/timesheets/:id',
        element: (
          <RouteGuard path="/app/time">
            <TimesheetDetailPage />
          </RouteGuard>
        ),
      },
      {
        path: 'time/leave/request',
        element: (
          <RouteGuard path="/app/time">
            <LeaveRequestPage />
          </RouteGuard>
        ),
      },
      {
        path: 'invoices',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN]}>
            <Invoices />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN, UserRole.USER]}>
            <Reports />
          </RoleGuard>
        ),
      },
      {
        path: 'analytics',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN]}>
            <AdvancedAnalytics />
          </RoleGuard>
        ),
      },
      {
        path: 'white-label',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER]}>
            <WhiteLabel />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'billing',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN]}>
            <Billing />
          </RoleGuard>
        ),
      },
    ],
  },
])
