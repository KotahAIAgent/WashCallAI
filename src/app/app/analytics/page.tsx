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
import { LineChart } from '@/components/analytics/LineChart'
import { PieChart } from '@/components/analytics/PieChart'
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel'
import { AnalyticsPageClient } from './AnalyticsPageClient'

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

  // Prepare pie chart data
  const pieChartData = [
    { name: 'Inbound', value: inboundCalls.count || 0, color: '#10b981' },
    { name: 'Outbound', value: outboundCalls.count || 0, color: '#3b82f6' },
  ].filter(item => item.value > 0)

  // Prepare line chart data (daily calls trend)
  const lineChartData = chartData.map(day => ({
    date: day.date,
    value: day.inbound + day.outbound,
  }))

  // Prepare conversion funnel data
  const totalCalls = callsThisMonth.count || 0
  const totalLeadsCount = totalLeads.count || 0
  const interestedCount = interestedLeads.count || 0
  const bookedCount = statusCounts.booked || 0
  const customerCount = statusCounts.customer || 0

  const funnelStages = [
    {
      name: 'Calls',
      value: totalCalls,
      percentage: 100,
      color: '#8b5cf6',
    },
    {
      name: 'Leads',
      value: totalLeadsCount,
      percentage: totalCalls > 0 ? Math.round((totalLeadsCount / totalCalls) * 100) : 0,
      color: '#a78bfa',
    },
    {
      name: 'Interested',
      value: interestedCount,
      percentage: totalLeadsCount > 0 ? Math.round((interestedCount / totalLeadsCount) * 100) : 0,
      color: '#c4b5fd',
    },
    {
      name: 'Booked',
      value: bookedCount,
      percentage: interestedCount > 0 ? Math.round((bookedCount / interestedCount) * 100) : 0,
      color: '#ddd6fe',
    },
    {
      name: 'Customers',
      value: customerCount,
      percentage: bookedCount > 0 ? Math.round((customerCount / bookedCount) * 100) : 0,
      color: '#ede9fe',
    },
  ].filter(stage => stage.value > 0)

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
    pieChartData,
    lineChartData,
    funnelStages,
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

  return <AnalyticsPageClient initialData={data} />
}

