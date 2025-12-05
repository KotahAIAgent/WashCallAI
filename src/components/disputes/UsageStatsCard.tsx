'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Phone, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface UsageStatsProps {
  stats: {
    plan: string | null
    billableCallsThisMonth: number
    monthlyLimit: number
    remainingCalls: number
    pendingDisputes: number
    refundedCredits: number
    billingPeriod: {
      month: number
      year: number
    }
  }
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function UsageStatsCard({ stats }: UsageStatsProps) {
  const usagePercent = stats.monthlyLimit > 0 
    ? Math.min((stats.billableCallsThisMonth / stats.monthlyLimit) * 100, 100)
    : 0

  const isNearLimit = usagePercent >= 80
  const isOverLimit = usagePercent >= 100

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Current Usage */}
      <Card className={isOverLimit ? 'border-red-200' : isNearLimit ? 'border-yellow-200' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outbound Calls Used</CardTitle>
          <Phone className={`h-4 w-4 ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.billableCallsThisMonth}
            <span className="text-sm font-normal text-muted-foreground">
              {stats.monthlyLimit > 0 ? ` / ${stats.monthlyLimit}` : ' (no limit)'}
            </span>
          </div>
          {stats.monthlyLimit > 0 && (
            <Progress 
              value={usagePercent} 
              className={`mt-2 ${isOverLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
            />
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {monthNames[stats.billingPeriod.month - 1]} {stats.billingPeriod.year}
          </p>
        </CardContent>
      </Card>

      {/* Remaining Calls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Calls</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.monthlyLimit > 0 ? Math.max(stats.remainingCalls, 0) : '∞'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.plan ? `${stats.plan.charAt(0).toUpperCase() + stats.plan.slice(1)} plan` : 'No plan'}
          </p>
        </CardContent>
      </Card>

      {/* Pending Disputes */}
      <Card className={stats.pendingDisputes > 0 ? 'border-yellow-200' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Disputes</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${stats.pendingDisputes > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingDisputes}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Under review
          </p>
        </CardContent>
      </Card>

      {/* Refunded Credits */}
      <Card className={stats.refundedCredits > 0 ? 'border-green-200' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credits Refunded</CardTitle>
          <CheckCircle2 className={`h-4 w-4 ${stats.refundedCredits > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.refundedCredits}</div>
          <p className="text-xs text-muted-foreground mt-2">
            This billing period
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

