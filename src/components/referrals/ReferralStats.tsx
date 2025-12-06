'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, DollarSign, Clock, CheckCircle } from 'lucide-react'

interface ReferralStatsProps {
  stats: {
    totalReferrals: number
    successfulReferrals: number
    pendingReferrals: number
    totalEarnings: number
  }
}

export function ReferralStats({ stats }: ReferralStatsProps) {
  const statItems = [
    {
      label: 'Total Referrals',
      value: stats.totalReferrals,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Successful',
      value: stats.successfulReferrals,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Pending',
      value: stats.pendingReferrals,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Total Earnings',
      value: `$${stats.totalEarnings}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

