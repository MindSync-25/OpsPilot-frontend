import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Users, DollarSign, Activity, Target, Zap, ArrowUpRight, ArrowDownRight, Calendar, Filter } from 'lucide-react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Line, BarChart, Bar, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export default function AdvancedAnalytics() {
  const { hasAdvancedAnalytics, isLoading } = useFeatureAccess()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('predictive')
  const [timeRange, setTimeRange] = useState('6months')
  const [comparisonMode, setComparisonMode] = useState('yoy')

  // Fetch real analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await api.get('/analytics')
      return response.data
    },
    enabled: hasAdvancedAnalytics && !isLoading
  })

  useEffect(() => {
    if (!isLoading && !hasAdvancedAnalytics) {
      navigate('/app/billing')
    }
  }, [hasAdvancedAnalytics, isLoading, navigate])

  if (isLoading || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAdvancedAnalytics) {
    return null
  }

  // Use real data or fallback to empty arrays
  const revenueForecasting = analyticsData?.revenueAnalytics?.forecast || []
  const cohortAnalysis = analyticsData?.cohortAnalysis || []
  const performanceMetrics = analyticsData?.performanceMetrics || []
  const resourceUtilization = analyticsData?.resourceUtilization || []
  const profitabilityTrend = analyticsData?.profitabilityTrend || []
  const clientLifetimeValue = analyticsData?.clientLifetimeValue || []
  const kpiMetrics = analyticsData?.kpiMetrics || []

  // Calculate actual averages from profitability data
  const avgRevenue = profitabilityTrend.length > 0
    ? profitabilityTrend.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0) / profitabilityTrend.length
    : 0
  const avgCost = profitabilityTrend.length > 0
    ? profitabilityTrend.reduce((sum, item) => sum + (Number(item.cost) || 0), 0) / profitabilityTrend.length
    : 0
  const avgMargin = profitabilityTrend.length > 0
    ? profitabilityTrend.reduce((sum, item) => sum + (Number(item.margin) || 0), 0) / profitabilityTrend.length
    : 0

  return (
    <div className="space-y-6 p-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Advanced Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            Predictive insights, cohort analysis, and business intelligence
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={comparisonMode} onValueChange={setComparisonMode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yoy">Year over Year</SelectItem>
              <SelectItem value="mom">Month over Month</SelectItem>
              <SelectItem value="wow">Week over Week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="2years">Last 2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Predictive KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiMetrics.map((metric) => {
          // Map icon name to component
          const iconMap: Record<string, any> = {
            Target,
            Users,
            Zap,
            TrendingUp,
            DollarSign,
            Activity
          }
          const Icon = iconMap[metric.icon] || Target
          const isPositive = metric.trend === 'up'
          
          return (
            <Card key={metric.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-xs">
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                      {metric.change}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {metric.confidence} confidence
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="predictive">
            <Target className="h-4 w-4 mr-2" />
            Predictive
          </TabsTrigger>
          <TabsTrigger value="cohort">
            <Users className="h-4 w-4 mr-2" />
            Cohort
          </TabsTrigger>
          <TabsTrigger value="profitability">
            <DollarSign className="h-4 w-4 mr-2" />
            Profitability
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="resources">
            <Zap className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Predictive Analytics */}
        <TabsContent value="predictive" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Revenue Forecasting
                </CardTitle>
                <CardDescription>ML-powered revenue predictions with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={revenueForecasting}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `₹${Number(value).toLocaleString()}`}
                      contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      fill="#3b82f6" 
                      fillOpacity={0.1}
                      stroke="none"
                      name="Upper Bound"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      fill="#3b82f6" 
                      fillOpacity={0.1}
                      stroke="none"
                      name="Lower Bound"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Actual Revenue"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="Predicted Revenue"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Client Lifetime Value by Segment
                </CardTitle>
                <CardDescription>LTV analysis across customer segments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clientLifetimeValue} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="segment" type="category" width={100} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'Retention') return `${value}%`
                        return `₹${Number(value).toLocaleString()}`
                      }}
                    />
                    <Legend />
                    <Bar dataKey="ltv" fill="#8b5cf6" name="Lifetime Value" />
                    <Bar dataKey="acquisition" fill="#ec4899" name="Acquisition Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Insights & Recommendations</CardTitle>
              <CardDescription>
                {profitabilityTrend.length === 0 && cohortAnalysis.length === 0 
                  ? 'Add invoices, clients, and projects to generate insights' 
                  : 'Data-driven business insights'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profitabilityTrend.length === 0 && cohortAnalysis.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-center">
                    No data available yet. Start by creating invoices, adding clients, and tracking projects to see insights here.
                  </p>
                </div>
              ) : (
                <>
                  {avgRevenue > 50000 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Strong Revenue Performance</h4>
                        <p className="text-sm text-muted-foreground">
                          Average monthly revenue of ₹{Math.round(avgRevenue).toLocaleString()} indicates healthy business growth.
                        </p>
                      </div>
                    </div>
                  )}
                  {avgMargin > 30 && (
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Healthy Profit Margins</h4>
                        <p className="text-sm text-muted-foreground">
                          Your {avgMargin.toFixed(1)}% profit margin is above industry average. Continue optimizing costs.
                        </p>
                      </div>
                    </div>
                  )}
                  {cohortAnalysis.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                      <Activity className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Client Retention Tracking</h4>
                        <p className="text-sm text-muted-foreground">
                          Monitoring {cohortAnalysis.length} cohort(s). Focus on improving early retention rates.
                        </p>
                      </div>
                    </div>
                  )}
                  {profitabilityTrend.length > 0 && avgRevenue === 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                      <Activity className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm">Get Started</h4>
                        <p className="text-sm text-muted-foreground">
                          Create paid invoices and track time entries to see revenue analytics and insights.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohort" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Client Retention Cohort Analysis
              </CardTitle>
              <CardDescription>Month-over-month client retention by signup cohort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Cohort</th>
                      <th className="text-center p-2 font-semibold">M1</th>
                      <th className="text-center p-2 font-semibold">M2</th>
                      <th className="text-center p-2 font-semibold">M3</th>
                      <th className="text-center p-2 font-semibold">M4</th>
                      <th className="text-center p-2 font-semibold">M5</th>
                      <th className="text-center p-2 font-semibold">M6</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortAnalysis.map((row) => (
                      <tr key={row.cohort} className="border-b">
                        <td className="p-2 font-medium">{row.cohort}</td>
                        <td className="text-center p-2">
                          <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            {row.m1}%
                          </span>
                        </td>
                        <td className="text-center p-2">
                          {row.m2 && (
                            <span className={`inline-block px-2 py-1 rounded ${
                              row.m2 >= 85 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              row.m2 >= 70 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {row.m2}%
                            </span>
                          )}
                        </td>
                        <td className="text-center p-2">
                          {row.m3 && (
                            <span className={`inline-block px-2 py-1 rounded ${
                              row.m3 >= 75 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              row.m3 >= 60 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {row.m3}%
                            </span>
                          )}
                        </td>
                        <td className="text-center p-2">
                          {row.m4 && (
                            <span className={`inline-block px-2 py-1 rounded ${
                              row.m4 >= 70 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              row.m4 >= 55 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {row.m4}%
                            </span>
                          )}
                        </td>
                        <td className="text-center p-2">
                          {row.m5 && (
                            <span className={`inline-block px-2 py-1 rounded ${
                              row.m5 >= 65 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              row.m5 >= 50 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {row.m5}%
                            </span>
                          )}
                        </td>
                        <td className="text-center p-2">
                          {row.m6 && (
                            <span className={`inline-block px-2 py-1 rounded ${
                              row.m6 >= 62 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              row.m6 >= 48 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                              'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}>
                              {row.m6}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Cohort Insights</h4>
                {cohortAnalysis.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add clients to your account to see cohort retention analysis.
                  </p>
                ) : (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tracking {cohortAnalysis.length} client cohort(s)</li>
                    <li>• Monitor retention trends across monthly cohorts</li>
                    <li>• Early retention is key to long-term success</li>
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profitability Analysis */}
        <TabsContent value="profitability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Profitability Trends & Margin Analysis
              </CardTitle>
              <CardDescription>Revenue, costs, and profit margins over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={profitabilityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Margin') return `${value}%`
                      return `₹${Number(value).toLocaleString()}`
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar yAxisId="left" dataKey="cost" fill="#f59e0b" name="Cost" />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="Profit Margin %"
                    dot={{ fill: '#8b5cf6', r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Revenue</p>
                  <p className="text-xl font-bold text-green-600">
                    ₹{avgRevenue > 0 ? Math.round(avgRevenue).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Cost</p>
                  <p className="text-xl font-bold text-amber-600">
                    ₹{avgCost > 0 ? Math.round(avgCost).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Margin</p>
                  <p className="text-xl font-bold text-purple-600">
                    {avgMargin > 0 ? avgMargin.toFixed(1) : '0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Scorecard */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Multi-Dimensional Performance Scorecard
              </CardTitle>
              <CardDescription>Radar analysis of key performance indicators vs targets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={performanceMetrics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Actual Score" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.5}
                  />
                  <Radar 
                    name="Target" 
                    dataKey="target" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.25}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.metric} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{metric.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{metric.score}</span>
                      <span className="text-muted-foreground">/ {metric.target}</span>
                      {metric.score >= metric.target ? (
                        <Badge className="bg-green-500">On Target</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600">Below</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resource Utilization */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Resource Utilization & Efficiency
              </CardTitle>
              <CardDescription>Team capacity planning and billable utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={resourceUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="planned" fill="#94a3b8" name="Planned Capacity" />
                  <Bar dataKey="actual" fill="#3b82f6" name="Actual Utilization" />
                  <Bar dataKey="billable" fill="#10b981" name="Billable Hours" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-3">Optimization Recommendations</h4>
                {resourceUtilization.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Track time entries and team assignments to see resource utilization insights.
                  </p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {resourceUtilization.some(r => r.actual > r.planned) && (
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Some teams exceeding planned capacity. Consider workload balancing.</span>
                      </div>
                    )}
                    {resourceUtilization.some(r => r.actual < r.planned * 0.8) && (
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">!</span>
                        <span>Some teams under-utilized. Optimize resource allocation.</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">i</span>
                      <span>Track billable hours to maximize profitability and efficiency.</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Report
        </Button>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Custom Dashboard
        </Button>
        <Button variant="outline">
          Export Analytics
        </Button>
      </div>
    </div>
  )
}
