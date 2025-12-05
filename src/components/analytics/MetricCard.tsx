'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  description?: string
}

export function MetricCard({ title, value, change, icon: Icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {change !== undefined && (
            <>
              {change > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{change}%</span>
                </>
              ) : change < 0 ? (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  <span className="text-red-500">{change}%</span>
                </>
              ) : (
                <span>No change</span>
              )}
              <span className="ml-1">from last month</span>
            </>
          )}
          {change === undefined && description && (
            <span>{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

