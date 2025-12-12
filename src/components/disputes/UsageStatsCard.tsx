'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Phone, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface UsageStatsProps {
  stats: {
    plan: string | null
    billableMinutesThisMonth?: number
    billableCallsThisMonth?: number
    monthlyLimitMinutes?: number
    remainingMinutes?: number
    // Legacy fields for backward compatibility
    monthlyLimit?: number
    remainingCalls?: number
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
  // Use minutes if available, fallback to calls for backward compatibility
  const billableMinutes = stats.billableMinutesThisMonth ?? 0
  const monthlyLimitMinutes = stats.monthlyLimitMinutes ?? (stats.monthlyLimit ?? 0)
  const remainingMinutes = stats.remainingMinutes ?? (stats.remainingCalls ?? 0)
  
  // For unlimited plans, monthlyLimitMinutes will be -1
  const usagePercent = monthlyLimitMinutes > 0 
    ? Math.min((billableMinutes / monthlyLimitMinutes) * 100, 100)
    : monthlyLimitMinutes === -1 ? 0 : 0

  const isNearLimit = usagePercent >= 80
  const isOverLimit = usagePercent >= 100

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Current Usage */}
      <Card className={isOverLimit ? 'border-red-200' : isNearLimit ? 'border-yellow-200' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outbound Minutes Used</CardTitle>
          <Phone className={`h-4 w-4 ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {billableMinutes.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground">
              {monthlyLimitMinutes > 0 ? ` / ${monthlyLimitMinutes.toLocaleString()}` : monthlyLimitMinutes === -1 ? ' (unlimited)' : ' (no limit)'}
            </span>
          </div>
          {monthlyLimitMinutes > 0 && (
            <Progress 
              value={usagePercent} 
              className={`mt-2 ${isOverLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
            />
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {monthNames[stats.billingPeriod.month - 1]} {stats.billingPeriod.year}
            {stats.billableCallsThisMonth && (
              <span className="ml-2">({stats.billableCallsThisMonth} calls)</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Remaining Minutes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Minutes</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {monthlyLimitMinutes === -1 ? '∞' : monthlyLimitMinutes > 0 ? Math.max(remainingMinutes, 0).toLocaleString() : 'N/A'}
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

