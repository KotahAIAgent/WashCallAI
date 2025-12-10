'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Users,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart'
import { MetricCard } from '@/components/analytics/MetricCard'
import { LineChart } from '@/components/analytics/LineChart'
import { PieChart } from '@/components/analytics/PieChart'
import { ConversionFunnel } from '@/components/analytics/ConversionFunnel'
import { FilterBar } from '@/components/analytics/FilterBar'
import { subDays } from 'date-fns'

interface AnalyticsPageClientProps {
  initialData: {
    metrics: any
    chartData: any[]
    statusCounts: Record<string, number>
    pieChartData: any[]
    successPieChartData: any[]
    lineChartData: any[]
    funnelStages: any[]
  }
  initialDateFrom?: string
  initialDateTo?: string
}

export function AnalyticsPageClient({ initialData, initialDateFrom, initialDateTo }: AnalyticsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const getInitialDateRange = () => {
    if (initialDateFrom && initialDateTo) {
      return {
        from: new Date(initialDateFrom),
        to: new Date(initialDateTo),
      }
    }
    return {
      from: subDays(new Date(), 30),
      to: new Date(),
    }
  }

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(getInitialDateRange())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [data, setData] = useState(initialData)

  // Update date range and data when searchParams change
  useEffect(() => {
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom && dateTo) {
      setDateRange({
        from: new Date(dateFrom),
        to: new Date(dateTo),
      })
    }
    // Update data when initialData changes (from server re-render)
    setData(initialData)
  }, [searchParams, initialData])

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
    
    // Update URL with searchParams
    const params = new URLSearchParams(searchParams.toString())
    if (range.from && range.to) {
      params.set('dateFrom', range.from.toISOString().split('T')[0])
      params.set('dateTo', range.to.toISOString().split('T')[0])
    } else {
      params.delete('dateFrom')
      params.delete('dateTo')
    }
    router.push(`/app/analytics?${params.toString()}`)
  }

  const handleReset = () => {
    const defaultRange = { from: subDays(new Date(), 30), to: new Date() }
    setDateRange(defaultRange)
    setStatusFilter('all')
    
    // Clear searchParams
    router.push('/app/analytics')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your performance and growth over time
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onReset={handleReset}
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Calls"
          value={data.metrics.callsThisMonth}
          change={data.metrics.callsChange}
          icon={Phone}
          description="Unique calls this period"
        />
        <MetricCard
          title="New Leads"
          value={data.metrics.leadsThisMonth}
          change={data.metrics.leadsChange}
          icon={Users}
          description="This period"
        />
        <MetricCard
          title="Successful Calls"
          value={data.metrics.successfulCalls || 0}
          icon={CheckCircle2}
          description="Completed/Answered"
        />
        <MetricCard
          title="Failed Calls"
          value={data.metrics.failedCalls || 0}
          icon={XCircle}
          description="Failed/Voicemail"
        />
      </div>
      
      {/* Inbound/Outbound Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-green-500" />
              Inbound Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Inbound</span>
                <span className="text-2xl font-bold">{data.metrics.inboundCalls || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Successful</span>
                <span className="text-lg font-semibold text-green-600">{data.metrics.inboundSuccessful || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="text-lg font-semibold text-red-600">{data.metrics.inboundFailed || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneOutgoing className="h-5 w-5 text-blue-500" />
              Outbound Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Outbound</span>
                <span className="text-2xl font-bold">{data.metrics.outboundCalls || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Successful</span>
                <span className="text-lg font-semibold text-green-600">{data.metrics.outboundSuccessful || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Failed</span>
                <span className="text-lg font-semibold text-red-600">{data.metrics.outboundFailed || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Call Volume Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Volume</CardTitle>
            <CardDescription>Inbound vs Outbound calls by month</CardDescription>
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

      {/* Additional Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Call Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Call Trend</CardTitle>
            <CardDescription>Monthly call volume trend</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={data.lineChartData} 
              dataKey="value" 
              name="Total Calls"
              color="#8b5cf6"
            />
          </CardContent>
        </Card>

        {/* Call Type Pie Chart */}
        {data.pieChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Call Distribution</CardTitle>
              <CardDescription>Inbound vs Outbound calls</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart data={data.pieChartData} />
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Success/Failed Chart */}
      {data.successPieChartData && data.successPieChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Call Success Rate</CardTitle>
            <CardDescription>Successful vs Failed calls</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={data.successPieChartData} />
          </CardContent>
        </Card>
      )}
      
      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.metrics.conversionRate}%</div>
            <p className="text-sm text-muted-foreground mt-1">Leads → Interested</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg Call Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.floor(data.metrics.avgCallDuration / 60)}:{(data.metrics.avgCallDuration % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Minutes:Seconds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.metrics.totalLeads}</div>
            <p className="text-sm text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
      </div>

      {/* Conversion Funnel */}
      {data.funnelStages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Track leads from calls to customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ConversionFunnel stages={data.funnelStages} />
          </CardContent>
        </Card>
      )}

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

