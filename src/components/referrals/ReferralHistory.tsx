'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { Users, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface Referral {
  id: string
  created_at: string
  referred_email: string | null
  referred_name: string | null
  status: 'pending' | 'completed' | 'expired'
  reward_amount: number
  completed_at: string | null
}

interface ReferralHistoryProps {
  referrals: Referral[]
}

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock 
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2 
  },
  expired: { 
    label: 'Expired', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    icon: XCircle 
  },
}

export function ReferralHistory({ referrals }: ReferralHistoryProps) {
  if (referrals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>Track your referrals and earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No referrals yet</p>
            <p className="text-sm">Share your link to start earning rewards!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral History</CardTitle>
        <CardDescription>Track your referrals and earnings</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Mobile Card View */}
        <div className="block md:hidden space-y-3">
          {referrals.map((referral) => {
            const status = statusConfig[referral.status]
            const StatusIcon = status.icon
            return (
              <div key={referral.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {referral.referred_name || referral.referred_email || 'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(referral.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge className={status.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                {referral.status === 'completed' && (
                  <div className="mt-2 text-sm font-medium text-green-600">
                    +${referral.reward_amount} earned
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referred Business</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => {
                const status = statusConfig[referral.status]
                const StatusIcon = status.icon
                return (
                  <TableRow key={referral.id}>
                    <TableCell className="font-medium">
                      {referral.referred_name || referral.referred_email || 'Anonymous'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(referral.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {referral.status === 'completed' ? (
                        <span className="text-green-600 font-medium">
                          +${referral.reward_amount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">$50</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {referral.completed_at 
                        ? format(new Date(referral.completed_at), 'MMM d, yyyy')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

