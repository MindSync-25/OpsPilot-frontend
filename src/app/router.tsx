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
import Tasks from '@/pages/Tasks.tsx'
import Clients from '@/pages/Clients.tsx'
import ClientDetail from '@/pages/ClientDetail.tsx'
import TeamNew from '@/pages/TeamNew.tsx'
import TimeTracking from '@/pages/TimeTracking.tsx'
import Invoices from '@/pages/Invoices.tsx'
import Settings from '@/pages/Settings.tsx'

// Protected route wrapper
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <AppShell><Outlet /></AppShell>
}

// Public route wrapper (redirect to dashboard if already logged in)
const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />
  }
  
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/',
    element: <PublicRoute />,
    children: [
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
            <Tasks />
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
        path: 'invoices',
        element: (
          <RoleGuard allowedRoles={[UserRole.TOP_USER, UserRole.SUPER_USER, UserRole.ADMIN]}>
            <Invoices />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
])
