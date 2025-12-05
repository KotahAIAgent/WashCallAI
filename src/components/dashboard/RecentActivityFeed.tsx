'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  User, 
  ArrowRight,
  Clock
} from 'lucide-react'

interface Call {
  id: string
  created_at: string
  direction: string
  from_number: string | null
  to_number: string | null
  status: string
  summary: string | null
}

interface Lead {
  id: string
  created_at: string
  name: string | null
  phone: string | null
  status: string
  property_type: string | null
}

interface RecentActivityFeedProps {
  calls: Call[]
  leads: Lead[]
}

type ActivityItem = {
  id: string
  type: 'call' | 'lead'
  timestamp: Date
  data: Call | Lead
}

export function RecentActivityFeed({ calls, leads }: RecentActivityFeedProps) {
  // Combine and sort by timestamp
  const activities: ActivityItem[] = [
    ...calls.map(call => ({
      id: call.id,
      type: 'call' as const,
      timestamp: new Date(call.created_at),
      data: call,
    })),
    ...leads.map(lead => ({
      id: lead.id,
      type: 'lead' as const,
      timestamp: new Date(lead.created_at),
      data: lead,
    })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest calls and leads</CardDescription>
        </div>
        <Link href="/app/calls">
          <Button variant="ghost" size="sm">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Calls and leads will appear here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => (
              <ActivityItemComponent key={`${activity.type}-${activity.id}`} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityItemComponent({ activity }: { activity: ActivityItem }) {
  if (activity.type === 'call') {
    const call = activity.data as Call
    return (
      <Link href={`/app/calls?id=${call.id}`}>
        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
          <div className={`p-2 rounded-full ${
            call.direction === 'inbound' 
              ? 'bg-green-100 text-green-600' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            {call.direction === 'inbound' ? (
              <PhoneIncoming className="h-4 w-4" />
            ) : (
              <PhoneOutgoing className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {call.direction === 'inbound' ? 'Inbound Call' : 'Outbound Call'}
              </span>
              <Badge variant="outline" className="text-xs">
                {call.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {call.from_number || 'Unknown'} → {call.to_number || 'Unknown'}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
          </span>
        </div>
      </Link>
    )
  }

  // Lead
  const lead = activity.data as Lead
  return (
    <Link href={`/app/leads/${lead.id}`}>
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
        <div className="p-2 rounded-full bg-purple-100 text-purple-600">
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">New Lead</span>
            <Badge 
              variant={lead.status === 'interested' ? 'default' : 'outline'} 
              className="text-xs"
            >
              {lead.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {lead.name || 'Unknown'} • {lead.phone || 'No phone'}
          </p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
        </span>
      </div>
    </Link>
  )
}

