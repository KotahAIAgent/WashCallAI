import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Phone, 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Target,
  Zap
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'

async function getDashboardData(organizationId: string) {
  const supabase = createServerClient()
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)
  const fourteenDaysAgo = subDays(now, 14)
  const thirtyDaysAgo = subDays(now, 30)

  // Get current period stats (last 7 days)
  const [
    callsThisWeek,
    callsLastWeek,
    leadsThisWeek,
    leadsLastWeek,
    appointmentsThisWeek,
    totalLeads,
    interestedLeads,
    recentCalls,
    recentLeads,
    upcomingAppointments,
    dailyCallData,
  ] = await Promise.all([
    // Calls this week
    supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo.toISOString()),
    // Calls last week (for comparison)
    supabase
      .from('calls')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString()),
    // Leads this week
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo.toISOString()),
    // Leads last week
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString()),
    // Appointments this week
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo.toISOString()),
    // Total leads all time
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    // Interested leads
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'interested'),
    // Recent calls
    supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5),
    // Recent leads
    supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5),
    // Upcoming appointments
    supabase
      .from('appointments')
      .select('*, leads(name, phone)')
      .eq('organization_id', organizationId)
      .gte('start_time', now.toISOString())
      .order('start_time', { ascending: true })
      .limit(5),
    // Daily call data for chart (last 7 days)
    supabase
      .from('calls')
      .select('created_at, direction, status')
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
  ])

  // Calculate percentage changes
  const callsChange = callsLastWeek.count 
    ? ((callsThisWeek.count || 0) - callsLastWeek.count) / callsLastWeek.count * 100 
    : 0
  const leadsChange = leadsLastWeek.count 
    ? ((leadsThisWeek.count || 0) - leadsLastWeek.count) / leadsLastWeek.count * 100 
    : 0

  // Calculate conversion rate
  const conversionRate = totalLeads.count 
    ? Math.round((interestedLeads.count || 0) / totalLeads.count * 100) 
    : 0

  // Process daily data for chart
  const chartData = processChartData(dailyCallData.data || [], sevenDaysAgo)

  // Check if inbound/outbound counts
  const inboundCount = recentCalls.data?.filter(c => c.direction === 'inbound').length || 0
  const outboundCount = recentCalls.data?.filter(c => c.direction === 'outbound').length || 0

  return {
    stats: {
      callsThisWeek: callsThisWeek.count || 0,
      callsChange: Math.round(callsChange),
      leadsThisWeek: leadsThisWeek.count || 0,
      leadsChange: Math.round(leadsChange),
      appointmentsThisWeek: appointmentsThisWeek.count || 0,
      totalLeads: totalLeads.count || 0,
      conversionRate,
      inboundCount,
      outboundCount,
    },
    recentCalls: recentCalls.data || [],
    recentLeads: recentLeads.data || [],
    upcomingAppointments: upcomingAppointments.data || [],
    chartData,
  }
}

function processChartData(calls: any[], startDate: Date) {
  const days: { [key: string]: { date: string; inbound: number; outbound: number; total: number } } = {}
  
  // Initialize all 7 days
  for (let i = 0; i < 7; i++) {
    const date = subDays(new Date(), 6 - i)
    const key = format(date, 'yyyy-MM-dd')
    days[key] = {
      date: format(date, 'EEE'),
      inbound: 0,
      outbound: 0,
      total: 0,
    }
  }

  // Count calls per day
  calls.forEach(call => {
    const key = format(new Date(call.created_at), 'yyyy-MM-dd')
    if (days[key]) {
      days[key].total++
      if (call.direction === 'inbound') {
        days[key].inbound++
      } else {
        days[key].outbound++
      }
    }
  })

  return Object.values(days)
}

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No organization found</div>
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, plan')
    .eq('id', profile.organization_id)
    .single()

  const data = await getDashboardData(profile.organization_id)
  const firstName = profile.full_name?.split(' ')[0] || 'there'
  const hasData = data.stats.callsThisWeek > 0 || data.stats.totalLeads > 0

  // Get time-based greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's what's happening with {org?.name || 'your business'} today.
          </p>
        </div>
        <div className="flex-shrink-0">
          <QuickActions />
        </div>
      </div>

      {!hasData ? (
        <EmptyDashboard />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Total Calls */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.callsThisWeek}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {data.stats.callsChange > 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-green-500">+{data.stats.callsChange}%</span>
                    </>
                  ) : data.stats.callsChange < 0 ? (
                    <>
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500">{data.stats.callsChange}%</span>
                    </>
                  ) : (
                    <span>No change</span>
                  )}
                  <span className="ml-1">from last week</span>
                </div>
              </CardContent>
            </Card>

            {/* New Leads */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.leadsThisWeek}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {data.stats.leadsChange > 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                      <span className="text-green-500">+{data.stats.leadsChange}%</span>
                    </>
                  ) : data.stats.leadsChange < 0 ? (
                    <>
                      <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                      <span className="text-red-500">{data.stats.leadsChange}%</span>
                    </>
                  ) : (
                    <span>No change</span>
                  )}
                  <span className="ml-1">from last week</span>
                </div>
              </CardContent>
            </Card>

            {/* Appointments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.appointmentsThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Booked this week
                </p>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Leads → Interested
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Activity Row */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
            {/* Call Activity Chart */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Call Activity</CardTitle>
                <CardDescription>
                  Your call volume over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardChart data={data.chartData} />
              </CardContent>
            </Card>

            {/* Call Breakdown */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Call Breakdown</CardTitle>
                <CardDescription>Inbound vs Outbound this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneIncoming className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Inbound</span>
                    </div>
                    <span className="font-medium">{data.stats.inboundCount}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ 
                        width: `${data.stats.callsThisWeek > 0 ? (data.stats.inboundCount / data.stats.callsThisWeek * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Outbound</span>
                    </div>
                    <span className="font-medium">{data.stats.outboundCount}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ 
                        width: `${data.stats.callsThisWeek > 0 ? (data.stats.outboundCount / data.stats.callsThisWeek * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total this week</span>
                    <span className="font-semibold">{data.stats.callsThisWeek} calls</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* Recent Activity */}
            <RecentActivityFeed 
              calls={data.recentCalls} 
              leads={data.recentLeads} 
            />

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled estimates</CardDescription>
                </div>
                <Link href="/app/calendar">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {data.upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming appointments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.upcomingAppointments.map((apt: any) => (
                      <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{apt.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.leads?.name || 'Unknown'} • {apt.leads?.phone || 'No phone'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">
                            {format(new Date(apt.start_time), 'MMM d')}
                          </p>
                          <p className="text-muted-foreground">
                            {format(new Date(apt.start_time), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
