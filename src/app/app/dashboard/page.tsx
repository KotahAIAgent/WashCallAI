import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Phone, 
  Users, 
  TrendingUp, 
  TrendingDown,
  PhoneIncoming,
  PhoneOutgoing,
  Target,
  Sparkles,
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { DashboardChart } from '@/components/dashboard/DashboardChart'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'
import { InboundCallNotification } from '@/components/dashboard/InboundCallNotification'

async function getDashboardData(organizationId: string) {
  const supabase = createServerClient()
  const now = new Date()
  const sevenDaysAgo = subDays(now, 7)
  const fourteenDaysAgo = subDays(now, 14)
  const thirtyDaysAgo = subDays(now, 30)

  // Get current period stats (last 7 days)
  // IMPORTANT: Count unique calls by provider_call_id to avoid duplicates
  const [
    allCallsThisWeek,
    allCallsLastWeek,
    leadsThisWeek,
    leadsLastWeek,
    totalLeads,
    interestedLeads,
    recentCalls,
    recentLeads,
    dailyCallData,
  ] = await Promise.all([
    // All calls this week (we'll count unique provider_call_ids)
    supabase
      .from('calls')
      .select('provider_call_id, direction, status, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('provider_call_id', 'is', null),
    // All calls last week (for comparison)
    supabase
      .from('calls')
      .select('provider_call_id, direction, status, created_at')
      .eq('organization_id', organizationId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString())
      .not('provider_call_id', 'is', null),
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
    // Recent calls (deduplicated)
    supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
      // Note: deleted_at filter removed temporarily - run migration add-soft-delete-to-calls.sql to enable
      // .is('deleted_at', null) // Only show non-deleted calls
      .not('provider_call_id', 'is', null)
      .order('created_at', { ascending: false }),
    // Recent leads
    supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(5),
    // Daily call data for chart (last 7 days) - deduplicated
    supabase
      .from('calls')
      .select('provider_call_id, created_at, direction, status')
      .eq('organization_id', organizationId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .not('provider_call_id', 'is', null)
      .order('created_at', { ascending: true }),
  ])
  
  // Count unique calls by provider_call_id
  const uniqueCallsThisWeek = new Set(
    (allCallsThisWeek.data || [])
      .map(c => c.provider_call_id)
      .filter(Boolean)
  ).size
  
  const uniqueCallsLastWeek = new Set(
    (allCallsLastWeek.data || [])
      .map(c => c.provider_call_id)
      .filter(Boolean)
  ).size
  
  // Deduplicate recent calls
  const recentCallsMap = new Map()
  ;(recentCalls.data || []).forEach(call => {
    if (call.provider_call_id && !recentCallsMap.has(call.provider_call_id)) {
      recentCallsMap.set(call.provider_call_id, call)
    }
  })
  const deduplicatedRecentCalls = Array.from(recentCallsMap.values()).slice(0, 5)

  // Calculate percentage changes
  const callsChange = uniqueCallsLastWeek 
    ? ((uniqueCallsThisWeek || 0) - uniqueCallsLastWeek) / uniqueCallsLastWeek * 100 
    : 0
  const leadsChange = leadsLastWeek.count 
    ? ((leadsThisWeek.count || 0) - leadsLastWeek.count) / leadsLastWeek.count * 100 
    : 0

  // Calculate conversion rate
  const conversionRate = totalLeads.count 
    ? Math.round((interestedLeads.count || 0) / totalLeads.count * 100) 
    : 0

  // Process daily data for chart - deduplicate by provider_call_id
  const uniqueCallsByDay = (dailyCallData.data || []).reduce((acc: Map<string, any>, call: any) => {
    if (call.provider_call_id && !acc.has(call.provider_call_id)) {
      acc.set(call.provider_call_id, call)
    }
    return acc
  }, new Map())
  const chartData = processChartData(Array.from(uniqueCallsByDay.values()), sevenDaysAgo)

  // Count inbound/outbound from deduplicated calls
  const inboundCount = deduplicatedRecentCalls.filter(c => c.direction === 'inbound').length
  const outboundCount = deduplicatedRecentCalls.filter(c => c.direction === 'outbound').length

  return {
    stats: {
      callsThisWeek: uniqueCallsThisWeek || 0,
      callsChange: Math.round(callsChange),
      leadsThisWeek: leadsThisWeek.count || 0,
      leadsChange: Math.round(leadsChange),
      totalLeads: totalLeads.count || 0,
      conversionRate,
      inboundCount,
      outboundCount,
    },
    recentCalls: deduplicatedRecentCalls,
    recentLeads: recentLeads.data || [],
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
    <div className="space-y-6 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-cyan-950/20 pointer-events-none" />
      
      {/* Inbound Call Notification - Shows popup when new inbound call arrives */}
      <InboundCallNotification organizationId={profile.organization_id} />
      
      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            {greeting}, {firstName}!
            <span className="text-2xl">👋</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with <span className="text-purple-400 font-medium">{org?.name || 'your business'}</span> today.
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
          <div className="relative grid gap-4 grid-cols-2 lg:grid-cols-5">
            {/* Total Calls */}
            <Card className="glass-card border-border/30 hover:border-purple-500/30 transition-all duration-300 group hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Phone className="h-4 w-4 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{data.stats.callsThisWeek}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {data.stats.callsChange > 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-3 w-3 text-green-400" />
                      <span className="text-green-400 font-medium">+{data.stats.callsChange}%</span>
                    </>
                  ) : data.stats.callsChange < 0 ? (
                    <>
                      <TrendingDown className="mr-1 h-3 w-3 text-red-400" />
                      <span className="text-red-400 font-medium">{data.stats.callsChange}%</span>
                    </>
                  ) : (
                    <span>No change</span>
                  )}
                  <span className="ml-1 opacity-70">from last week</span>
                </div>
              </CardContent>
            </Card>

            {/* New Leads */}
            <Card className="glass-card border-border/30 hover:border-cyan-500/30 transition-all duration-300 group hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
                <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                  <Users className="h-4 w-4 text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{data.stats.leadsThisWeek}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {data.stats.leadsChange > 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-3 w-3 text-green-400" />
                      <span className="text-green-400 font-medium">+{data.stats.leadsChange}%</span>
                    </>
                  ) : data.stats.leadsChange < 0 ? (
                    <>
                      <TrendingDown className="mr-1 h-3 w-3 text-red-400" />
                      <span className="text-red-400 font-medium">{data.stats.leadsChange}%</span>
                    </>
                  ) : (
                    <span>No change</span>
                  )}
                  <span className="ml-1 opacity-70">from last week</span>
                </div>
              </CardContent>
            </Card>

            {/* Inbound Calls */}
            <Card className="glass-card border-border/30 hover:border-green-500/30 transition-all duration-300 group hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Inbound Calls</CardTitle>
                <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <PhoneIncoming className="h-4 w-4 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{data.stats.inboundCount}</div>
                <p className="text-xs text-muted-foreground mt-1 opacity-70">
                  This week
                </p>
              </CardContent>
            </Card>

            {/* Outbound Calls */}
            <Card className="glass-card border-border/30 hover:border-blue-500/30 transition-all duration-300 group hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outbound Calls</CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <PhoneOutgoing className="h-4 w-4 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{data.stats.outboundCount}</div>
                <p className="text-xs text-muted-foreground mt-1 opacity-70">
                  This week
                </p>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="glass-card border-border/30 hover:border-pink-500/30 transition-all duration-300 group hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                <div className="p-2 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                  <Target className="h-4 w-4 text-pink-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{data.stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground mt-1 opacity-70">
                  Leads → Interested
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Activity Row */}
          <div className="relative grid gap-6 lg:grid-cols-7">
            {/* Call Activity Chart */}
            <Card className="lg:col-span-4 glass-card border-border/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Call Activity
                      <Sparkles className="h-4 w-4 text-purple-400" />
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Your call volume over the last 7 days
                    </CardDescription>
                  </div>
                  <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30">
                    Live Data
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <DashboardChart data={data.chartData} />
              </CardContent>
            </Card>

            {/* Call Breakdown */}
            <Card className="lg:col-span-3 glass-card border-border/30">
              <CardHeader>
                <CardTitle>Call Breakdown</CardTitle>
                <CardDescription>Inbound vs Outbound this week</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <PhoneIncoming className="h-4 w-4 text-green-400" />
                        </div>
                        <span className="text-sm font-medium">Inbound</span>
                      </div>
                      <span className="font-mono font-bold text-green-400">{data.stats.inboundCount}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500 shadow-glow-sm"
                        style={{ 
                          width: `${data.stats.callsThisWeek > 0 ? (data.stats.inboundCount / data.stats.callsThisWeek * 100) : 0}%`,
                          boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)'
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                          <PhoneOutgoing className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-medium">Outbound</span>
                      </div>
                      <span className="font-mono font-bold text-blue-400">{data.stats.outboundCount}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${data.stats.callsThisWeek > 0 ? (data.stats.outboundCount / data.stats.callsThisWeek * 100) : 0}%`,
                          boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total this week</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono gradient-text">{data.stats.callsThisWeek}</span>
                      <span className="text-sm text-muted-foreground">calls</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="relative grid gap-6">
            {/* Recent Activity */}
            <RecentActivityFeed 
              calls={data.recentCalls} 
              leads={data.recentLeads} 
            />
          </div>
        </>
      )}
    </div>
  )
}
