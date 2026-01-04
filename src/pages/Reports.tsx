import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, DollarSign, Users, Clock, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('revenue');

  // Fetch all reports
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', period],
    queryFn: async () => {
      const response = await apiClient.post('/api/v1/reports/revenue', { period });
      return response.data;
    }
  });

  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ['project-report', period],
    queryFn: async () => {
      const response = await apiClient.post('/api/v1/reports/projects', { period });
      return response.data;
    }
  });

  const { data: timeData, isLoading: timeLoading } = useQuery({
    queryKey: ['time-report', period],
    queryFn: async () => {
      const response = await apiClient.post('/api/v1/reports/time', { period });
      return response.data;
    }
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team-report', period],
    queryFn: async () => {
      const response = await apiClient.post('/api/v1/reports/team', { period });
      return response.data;
    }
  });

  const handleDownloadPDF = async (reportType: string) => {
    try {
      const response = await apiClient.post(
        `/api/v1/reports/${reportType}/pdf`,
        { period },
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your business performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="overall">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="projects">
            <BarChart3 className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="time">
            <Clock className="h-4 w-4 mr-2" />
            Time Tracking
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Revenue Analytics</h2>
            <Button onClick={() => handleDownloadPDF('revenue')} disabled={revenueLoading}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {revenueLoading ? (
            <div className="text-center py-12">Loading revenue data...</div>
          ) : revenueData ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(revenueData.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">{revenueData.totalInvoices} invoices</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(revenueData.paidAmount)}</div>
                    <p className="text-xs text-muted-foreground">{revenueData.paidInvoices} paid invoices</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{formatCurrency(revenueData.pendingAmount)}</div>
                    <p className="text-xs text-muted-foreground">{revenueData.pendingInvoices} pending</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
                    <DollarSign className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(revenueData.overdueAmount)}</div>
                    <p className="text-xs text-muted-foreground">{revenueData.overdueInvoices} overdue</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Daily Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Daily revenue over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData.dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Revenue" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Status</CardTitle>
                    <CardDescription>Distribution of revenue by invoice status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(revenueData.revenueByStatus || {}).map(([key, value]) => ({
                            name: key,
                            value: value
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(revenueData.revenueByStatus || {}).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Clients */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Top Clients by Revenue</CardTitle>
                    <CardDescription>Highest revenue-generating clients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData.revenueByClient?.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="clientName" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Project Report */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Project Analytics</h2>
            <Button onClick={() => handleDownloadPDF('projects')} disabled={projectLoading}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {projectLoading ? (
            <div className="text-center py-12">Loading project data...</div>
          ) : projectData ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projectData.totalProjects}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{projectData.activeProjects}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{projectData.completedProjects}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{projectData.avgCompletionRate?.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Task Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Distribution</CardTitle>
                    <CardDescription>Tasks by status across all projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectData.taskDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.status}: ${entry.count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {projectData.taskDistribution?.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Project Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Completion Rates</CardTitle>
                    <CardDescription>Completion percentage by project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectData.projectStats?.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="projectName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completionRate" fill="#10b981" name="Completion %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Time Report */}
        <TabsContent value="time" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Time Tracking Analytics</h2>
            <Button onClick={() => handleDownloadPDF('time')} disabled={timeLoading}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {timeLoading ? (
            <div className="text-center py-12">Loading time data...</div>
          ) : timeData ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatHours(timeData.totalMinutes)}</div>
                    <p className="text-xs text-muted-foreground">{timeData.totalEntries} entries</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
                    <Clock className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatHours(timeData.billableMinutes)}</div>
                    <p className="text-xs text-muted-foreground">
                      {((timeData.billableMinutes / timeData.totalMinutes) * 100).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{timeData.avgHoursPerDay?.toFixed(1)}h</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Daily Time Trend */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Time Tracking Trend</CardTitle>
                    <CardDescription>Daily time logged over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={timeData.dailyTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatHours(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="minutes" stroke="#3b82f6" name="Total Time" />
                        <Line type="monotone" dataKey="billableMinutes" stroke="#10b981" name="Billable Time" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Time by User */}
                <Card>
                  <CardHeader>
                    <CardTitle>Time by Team Member</CardTitle>
                    <CardDescription>Hours logged by each team member</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeData.timeByUser?.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="userName" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatHours(Number(value))} />
                        <Legend />
                        <Bar dataKey="totalMinutes" fill="#3b82f6" name="Total Time" />
                        <Bar dataKey="billableMinutes" fill="#10b981" name="Billable" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Time by Project */}
                <Card>
                  <CardHeader>
                    <CardTitle>Time by Project</CardTitle>
                    <CardDescription>Hours logged per project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeData.timeByProject?.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="projectName" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatHours(Number(value))} />
                        <Bar dataKey="totalMinutes" fill="#8b5cf6" name="Time" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        {/* Team Report */}
        <TabsContent value="team" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Team Productivity</h2>
            <Button onClick={() => handleDownloadPDF('team')} disabled={teamLoading}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {teamLoading ? (
            <div className="text-center py-12">Loading team data...</div>
          ) : teamData ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamData.totalMembers}</div>
                    <p className="text-xs text-muted-foreground">{teamData.activeMembers} active</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{teamData.totalTasksCompleted}</div>
                    <p className="text-xs text-muted-foreground">of {teamData.totalTasksAssigned} assigned</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{teamData.totalHoursLogged}h</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Member Performance */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Team Member Performance</CardTitle>
                    <CardDescription>Task completion and productivity scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={teamData.memberStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="userName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tasksCompleted" fill="#10b981" name="Completed" />
                        <Bar dataKey="tasksAssigned" fill="#3b82f6" name="Assigned" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Workload Distribution */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Workload Distribution</CardTitle>
                    <CardDescription>Current active tasks per team member</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={teamData.workloadDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="userName" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="currentWorkload" fill="#f59e0b" name="Active Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
