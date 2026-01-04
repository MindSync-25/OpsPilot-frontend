import { apiClient } from '@/lib/api';

export interface ActivityItem {
  id: string;
  type: 'PROJECT' | 'TASK' | 'TIMESHEET' | 'CLIENT' | 'TEAM';
  title: string;
  description: string;
  time: string;
  userName: string;
}

export interface DeadlineItem {
  id: string;
  type: 'PROJECT' | 'TASK';
  name: string;
  dueDate: string;
  daysRemaining: number;
  status: string;
}

export interface ProjectHoursItem {
  id: string;
  name: string;
  hours: number;
  billableHours: number;
  status: string;
}

export interface DashboardStats {
  // KPI Stats
  activeProjects: number;
  totalProjects: number;
  hoursThisWeek: number;
  hoursLastWeek: number;
  pendingTimesheets: number;
  teamMembers: number;
  activeTeamMembers: number;
  
  // Project breakdown
  planningProjects: number;
  onHoldProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  
  // Task stats
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  
  // Time tracking
  totalHoursLogged: number;
  billableHours: number;
  nonBillableHours: number;
  
  // Recent activities
  recentActivities: ActivityItem[];
  
  // Upcoming deadlines
  upcomingDeadlines: DeadlineItem[];
  
  // Top projects by hours
  topProjectsByHours: ProjectHoursItem[];
}

const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },
};

export default dashboardService;
