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
  Target,
} from 'lucide-react'
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from 'date-fns'
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart'
import { MetricCard } from '@/components/analytics/MetricCard'
import { LineChart } from '@/components/analytics/LineChart'
import { PieChart } from '@/components/analytics/PieChart'
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel'
import { AnalyticsPageClient } from './AnalyticsPageClient'

async function getAnalyticsData(
  organizationId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const supabase = createServerClient()
  const now = new Date()
  
  // Use provided dates or default to last 30 days
  const fromDate = dateFrom ? new Date(dateFrom) : subDays(now, 30)
  const toDate = dateTo ? new Date(dateTo) : now
  
  // For comparison period (previous period of same length)
  // Add 1 to include both start and end dates
  const periodLength = differenceInDays(toDate, fromDate) + 1
  const previousPeriodEnd = subDays(fromDate, 1)
  const previousPeriodStart = subDays(previousPeriodEnd, periodLength - 1)
  
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Get various stats
  // IMPORTANT: Count unique calls by provider_call_id to avoid duplicates
  const [
    allCallsThisPeriod,
    allCallsLastPeriod,
    leadsThisMonth,
    leadsLastMonth,
    interestedLeads,
    totalLeads,
    callsByDay,
    leadsByStatus,
    avgCallDuration,
  ] = await Promise.all([
    // All calls in selected period (we'll count unique provider_call_ids)
    supabase
      .from('calls')
      .select('provider_call_id, direction, status, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .not('provider_call_id', 'is', null),
    // Calls in previous period (for comparison)
    supabase
      .from('calls')
      .select('provider_call_id, direction, status, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString())
      .not('provider_call_id', 'is', null),
    // Leads in selected period
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString()),
    // Leads in previous period
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString()),
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
    // Calls by day (selected period) - for chart
    supabase
      .from('calls')
      .select('provider_call_id, created_at, direction, status')
      .eq('organization_id', organizationId)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .not('provider_call_id', 'is', null)
      .order('created_at', { ascending: true }),
    // Leads by status
    supabase
      .from('leads')
      .select('status')
      .eq('organization_id', organizationId),
    // Avg call duration
    supabase
      .from('calls')
      .select('duration_seconds')
      .eq('organization_id', organizationId)
      .not('duration_seconds', 'is', null)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString()),
  ])
  
  // Count unique calls by provider_call_id
  const uniqueCallsThisPeriod = new Set(
    (allCallsThisPeriod.data || [])
      .map(c => c.provider_call_id)
      .filter(Boolean)
  ).size
  
  const uniqueCallsLastPeriod = new Set(
    (allCallsLastPeriod.data || [])
      .map(c => c.provider_call_id)
      .filter(Boolean)
  ).size
  
  // Separate calls by direction and status
  const callsData = (allCallsThisPeriod.data || [])
  const uniqueCallIds = new Set(callsData.map(c => c.provider_call_id).filter(Boolean))
  
  // Get one record per unique call (take the first occurrence)
  const uniqueCalls = Array.from(uniqueCallIds).map(id => {
    return callsData.find(c => c.provider_call_id === id)!
  })
  
  // Count by direction
  const inboundCalls = uniqueCalls.filter(c => c.direction === 'inbound').length
  const outboundCalls = uniqueCalls.filter(c => c.direction === 'outbound').length
  
  // Count by status (successful = completed/answered, failed = failed/voicemail)
  const successfulCalls = uniqueCalls.filter(c => 
    c.status === 'completed' || c.status === 'answered'
  ).length
  const failedCalls = uniqueCalls.filter(c => 
    c.status === 'failed' || c.status === 'voicemail'
  ).length
  
  // Separate successful/failed by direction
  const inboundSuccessful = uniqueCalls.filter(c => 
    c.direction === 'inbound' && (c.status === 'completed' || c.status === 'answered')
  ).length
  const inboundFailed = uniqueCalls.filter(c => 
    c.direction === 'inbound' && (c.status === 'failed' || c.status === 'voicemail')
  ).length
  const outboundSuccessful = uniqueCalls.filter(c => 
    c.direction === 'outbound' && (c.status === 'completed' || c.status === 'answered')
  ).length
  const outboundFailed = uniqueCalls.filter(c => 
    c.direction === 'outbound' && (c.status === 'failed' || c.status === 'voicemail')
  ).length

  // Calculate changes
  const callsChange = uniqueCallsLastPeriod 
    ? Math.round(((uniqueCallsThisPeriod || 0) - uniqueCallsLastPeriod) / uniqueCallsLastPeriod * 100)
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

  // Process calls by day for chart - deduplicate by provider_call_id
  const uniqueCallsByDay = (callsByDay.data || []).reduce((acc: Map<string, any>, call: any) => {
    if (call.provider_call_id && !acc.has(call.provider_call_id)) {
      acc.set(call.provider_call_id, call)
    }
    return acc
  }, new Map())
  const chartData = processChartData(Array.from(uniqueCallsByDay.values()), fromDate, toDate)

  // Process leads by status
  const statusCounts = (leadsByStatus.data || []).reduce((acc: Record<string, number>, lead: any) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1
    return acc
  }, {})

  // Prepare pie chart data for inbound/outbound
  const pieChartData = [
    { name: 'Inbound', value: inboundCalls, color: '#10b981' },
    { name: 'Outbound', value: outboundCalls, color: '#3b82f6' },
  ].filter(item => item.value > 0)
  
  // Prepare pie chart data for successful/failed
  const successPieChartData = [
    { name: 'Successful', value: successfulCalls, color: '#10b981' },
    { name: 'Failed', value: failedCalls, color: '#ef4444' },
  ].filter(item => item.value > 0)

  // Prepare line chart data (daily calls trend)
  const lineChartData = chartData.map(day => ({
    date: day.date,
    value: day.inbound + day.outbound,
  }))

  // Prepare conversion funnel data
  const totalCalls = uniqueCallsThisPeriod || 0
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
      callsThisMonth: uniqueCallsThisPeriod || 0,
      callsChange,
      leadsThisMonth: leadsThisMonth.count || 0,
      leadsChange,
      conversionRate,
      avgCallDuration: avgDuration,
      inboundCalls,
      outboundCalls,
      successfulCalls,
      failedCalls,
      inboundSuccessful,
      inboundFailed,
      outboundSuccessful,
      outboundFailed,
      totalLeads: totalLeads.count || 0,
    },
    chartData,
    statusCounts,
    pieChartData,
    successPieChartData,
    lineChartData,
    funnelStages,
  }
}

function processChartData(calls: any[], fromDate: Date, toDate: Date) {
  // Group by month instead of day for better visualization
  const months: Record<string, { date: string; inbound: number; outbound: number }> = {}
  
  // Initialize all months in the date range
  const monthRange = eachMonthOfInterval({ start: fromDate, end: toDate })
  monthRange.forEach(date => {
    const key = format(date, 'yyyy-MM')
    months[key] = {
      date: format(date, 'MMM yyyy'),
      inbound: 0,
      outbound: 0,
    }
  })

  // Count calls per month
  calls.forEach(call => {
    const key = format(new Date(call.created_at), 'yyyy-MM')
    if (months[key]) {
      if (call.direction === 'inbound') {
        months[key].inbound++
      } else {
        months[key].outbound++
      }
    }
  })

  return Object.values(months)
}

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ dateFrom?: string; dateTo?: string }>
}) {
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

  const params = await searchParams
  const data = await getAnalyticsData(
    profile.organization_id,
    params.dateFrom,
    params.dateTo
  )

  return <AnalyticsPageClient initialData={data} initialDateFrom={params.dateFrom} initialDateTo={params.dateTo} />
}

