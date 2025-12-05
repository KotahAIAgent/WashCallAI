import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Users,
  Calendar,
  Clock,
  Target,
  Percent,
  ArrowUpRight
} from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart'
import { MetricCard } from '@/components/analytics/MetricCard'

async function getAnalyticsData(organizationId: string) {
  const supabase = createServerClient()
  const now = new Date()
  const thirtyDaysAgo = subDays(now, 30)
  const sixtyDaysAgo = subDays(now, 60)
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Get various stats
  const [
    callsThisMonth,
    callsLastMonth,
    leadsThisMonth,
    leadsLastMonth,
    appointmentsThisMonth,
    interestedLeads,
    totalLeads,
    callsByDay,
    leadsByStatus,
    inboundCalls,
    outboundCalls,
    avgCallDuration,
  ] = await Promise.all([
    // Calls this month
    supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', thisMonthStart.toISOString()),
    // Calls last month
    supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString()),
    // Leads this month
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', thisMonthStart.toISOString()),
    // Leads last month
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString()),
    // Appointments this month
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', thisMonthStart.toISOString()),
    // Interested leads
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'interested'),
    // Total leads
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    // Calls by day (last 30 days)
    supabase
      .from('calls')
      .select('created_at, direction')
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    // Leads by status
    supabase
      .from('leads')
      .select('status')
      .eq('organization_id', organizationId),
    // Inbound calls count
    supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('direction', 'inbound')
      .gte('created_at', thisMonthStart.toISOString()),
    // Outbound calls count
    supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('direction', 'outbound')
      .gte('created_at', thisMonthStart.toISOString()),
    // Avg call duration
    supabase
      .from('calls')
      .select('duration_seconds')
      .eq('organization_id', organizationId)
      .not('duration_seconds', 'is', null)
      .gte('created_at', thisMonthStart.toISOString()),
  ])

  // Calculate changes
  const callsChange = callsLastMonth.count 
    ? Math.round(((callsThisMonth.count || 0) - callsLastMonth.count) / callsLastMonth.count * 100)
    : 0
  const leadsChange = leadsLastMonth.count 
    ? Math.round(((leadsThisMonth.count || 0) - leadsLastMonth.count) / leadsLastMonth.count * 100)
    : 0

  // Calculate conversion rate
  const conversionRate = totalLeads.count 
    ? Math.round((interestedLeads.count || 0) / totalLeads.count * 100) 
    : 0

  // Calculate avg duration
  const avgDuration = avgCallDuration.data?.length
    ? Math.round(
        avgCallDuration.data.reduce((acc: number, c: any) => acc + (c.duration_seconds || 0), 0) / 
        avgCallDuration.data.length
      )
    : 0

  // Process calls by day for chart
  const chartData = processChartData(callsByDay.data || [])

  // Process leads by status
  const statusCounts = (leadsByStatus.data || []).reduce((acc: Record<string, number>, lead: any) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {})

  return {
    metrics: {
      callsThisMonth: callsThisMonth.count || 0,
      callsChange,
      leadsThisMonth: leadsThisMonth.count || 0,
      leadsChange,
      appointmentsThisMonth: appointmentsThisMonth.count || 0,
      conversionRate,
      avgCallDuration: avgDuration,
      inboundCalls: inboundCalls.count || 0,
      outboundCalls: outboundCalls.count || 0,
      totalLeads: totalLeads.count || 0,
    },
    chartData,
    statusCounts,
  }
}

function processChartData(calls: any[]) {
  const days: Record<string, { date: string; inbound: number; outbound: number }> = {}
  
  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const key = format(date, 'yyyy-MM-dd')
    days[key] = {
      date: format(date, 'MMM d'),
      inbound: 0,
      outbound: 0,
    }
  }

  // Count calls per day
  calls.forEach(call => {
    const key = format(new Date(call.created_at), 'yyyy-MM-dd')
    if (days[key]) {
      if (call.direction === 'inbound') {
        days[key].inbound++
      } else {
        days[key].outbound++
      }
    }
  })

  return Object.values(days)
}

export default async function AnalyticsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No organization found</div>
  }

  const data = await getAnalyticsData(profile.organization_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your performance and growth over time
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Calls"
          value={data.metrics.callsThisMonth}
          change={data.metrics.callsChange}
          icon={Phone}
          description="This month"
        />
        <MetricCard
          title="New Leads"
          value={data.metrics.leadsThisMonth}
          change={data.metrics.leadsChange}
          icon={Users}
          description="This month"
        />
        <MetricCard
          title="Appointments"
          value={data.metrics.appointmentsThisMonth}
          icon={Calendar}
          description="Booked this month"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.metrics.conversionRate}%`}
          icon={Target}
          description="Leads → Interested"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Call Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Volume</CardTitle>
            <CardDescription>Inbound vs Outbound calls (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart data={data.chartData} />
          </CardContent>
        </Card>

        {/* Call Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Call Breakdown</CardTitle>
            <CardDescription>This month's call types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PhoneIncoming className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Inbound</span>
                  </div>
                  <span className="font-bold">{data.metrics.inboundCalls}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ 
                      width: `${data.metrics.callsThisMonth > 0 
                        ? (data.metrics.inboundCalls / data.metrics.callsThisMonth * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Outbound</span>
                  </div>
                  <span className="font-bold">{data.metrics.outboundCalls}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all"
                    style={{ 
                      width: `${data.metrics.callsThisMonth > 0 
                        ? (data.metrics.outboundCalls / data.metrics.callsThisMonth * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg. Call Duration</span>
                <span className="font-medium">
                  {Math.floor(data.metrics.avgCallDuration / 60)}:{(data.metrics.avgCallDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Leads (All Time)</span>
                <span className="font-medium">{data.metrics.totalLeads}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Status Distribution</CardTitle>
          <CardDescription>Current status of all your leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {[
              { status: 'new', label: 'New', color: 'bg-blue-500' },
              { status: 'interested', label: 'Interested', color: 'bg-green-500' },
              { status: 'not_interested', label: 'Not Interested', color: 'bg-gray-400' },
              { status: 'call_back', label: 'Call Back', color: 'bg-amber-500' },
              { status: 'booked', label: 'Booked', color: 'bg-purple-500' },
              { status: 'customer', label: 'Customer', color: 'bg-emerald-500' },
            ].map(({ status, label, color }) => (
              <div key={status} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-2xl font-bold">
                  {data.statusCounts[status] || 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

