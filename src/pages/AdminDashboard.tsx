import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, Building2, TrendingUp, Activity, DollarSign, BarChart3,
  LogOut, RefreshCw, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface PlatformAnalytics {
  totalCompanies: number
  totalUsers: number
  activeUsersToday: number
  activeUsersThisWeek: number
  activeUsersThisMonth: number
  companiesByTier: CompanyByTier[]
  upgradedThisMonth: number
  downgradedThisMonth: number
  churnedThisMonth: number
  churnRate: number
  topFeatures: FeatureUsage[]
  signupTrends: SignupTrend[]
  revenueByTier: RevenueByTier[]
}

interface CompanyByTier {
  tier: string
  count: number
  companies: CompanyDetail[]
}

interface CompanyDetail {
  id: string
  name: string
  tier: string
  userCount: number
  createdAt: string
  lastActive: string
  isActive: boolean
}

interface FeatureUsage {
  featureName: string
  usageCount: number
  uniqueCompanies: number
  adoptionRate: number
}

interface SignupTrend {
  date: string
  signups: number
  tier: string
}

interface RevenueByTier {
  tier: string
  monthlyRevenue: number
  companyCount: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalytics = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8081/api/v1/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error || 'Failed to load data'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchAnalytics}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prepare chart data
  const tierDistribution = analytics.companiesByTier.map(tier => ({
    name: tier.tier,
    value: tier.count,
  }))

  const revenueChart = analytics.revenueByTier.map(tier => ({
    tier: tier.tier,
    revenue: tier.revenue,
    companies: tier.companyCount,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Product Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Platform-wide metrics and insights
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Companies
              </CardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCompanies}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.activeUsersThisMonth} active this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Today
              </CardTitle>
              <Activity className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeUsersToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.activeUsersThisWeek} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Churn Rate
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.churnRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="companies" className="space-y-4">
          <TabsList>
            <TabsTrigger value="companies">Companies by Tier</TabsTrigger>
            <TabsTrigger value="features">Feature Usage</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Companies by Tier Tab */}
          <TabsContent value="companies" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Companies Distribution</CardTitle>
                  <CardDescription>Companies across subscription tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={tierDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tierDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tier Summary</CardTitle>
                  <CardDescription>Companies per subscription tier</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.companiesByTier.map((tier, index) => (
                      <div key={tier.tier} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{tier.tier}</span>
                        </div>
                        <Badge variant="secondary">{tier.count} companies</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Company Details Tables */}
            {analytics.companiesByTier.map((tierGroup) => (
              <Card key={tierGroup.tier}>
                <CardHeader>
                  <CardTitle>{tierGroup.tier} Tier Companies</CardTitle>
                  <CardDescription>
                    {tierGroup.count} companies in {tierGroup.tier} tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-semibold">Company</th>
                          <th className="text-center p-2 font-semibold">Users</th>
                          <th className="text-center p-2 font-semibold">Created</th>
                          <th className="text-center p-2 font-semibold">Last Active</th>
                          <th className="text-center p-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tierGroup.companies.map((company) => (
                          <tr key={company.id} className="border-b hover:bg-muted/50">
                            <td className="p-2 font-medium">{company.name}</td>
                            <td className="text-center p-2">{company.userCount}</td>
                            <td className="text-center p-2">
                              {new Date(company.createdAt).toLocaleDateString()}
                            </td>
                            <td className="text-center p-2">
                              {company.lastActive !== 'Never'
                                ? new Date(company.lastActive).toLocaleDateString()
                                : 'Never'}
                            </td>
                            <td className="text-center p-2">
                              {company.isActive ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Feature Usage Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Adoption</CardTitle>
                <CardDescription>Most used features across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.topFeatures}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="featureName" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="usageCount" fill="#3b82f6" name="Total Usage" />
                    <Bar yAxisId="left" dataKey="uniqueCompanies" fill="#10b981" name="Companies Using" />
                    <Bar yAxisId="right" dataKey="adoptionRate" fill="#f59e0b" name="Adoption %" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {analytics.topFeatures.map((feature) => (
                    <div key={feature.featureName} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{feature.featureName}</h3>
                        <Badge>{feature.adoptionRate.toFixed(1)}% adoption</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Total usage: {feature.usageCount.toLocaleString()}</p>
                        <p>Used by: {feature.uniqueCompanies} companies</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Upgrades</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.upgradedThisMonth}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Downgrades</CardTitle>
                  <ArrowDownRight className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {analytics.downgradedThisMonth}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Churned</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {analytics.churnedThisMonth}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Signup Trends</CardTitle>
                <CardDescription>New company signups over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.signupTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="signups" stroke="#3b82f6" name="Signups" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Recurring Revenue by Tier</CardTitle>
                <CardDescription>Projected MRR based on subscription tiers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Monthly Revenue" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-6">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total MRR</p>
                        <p className="text-3xl font-bold text-green-600">
                          ₹{analytics.revenueByTier
                            .reduce((sum, tier) => sum + tier.monthlyRevenue, 0)
                            .toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 text-green-600 opacity-50" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
