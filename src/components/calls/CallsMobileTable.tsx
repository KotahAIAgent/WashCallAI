'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileTable } from '@/components/ui/mobile-table'

interface Call {
  id: string
  direction: string
  status: string
  from_number: string | null
  to_number: string | null
  duration_seconds: number | null
  formatted_date: string
}

interface CallsMobileTableProps {
  calls: Call[]
}

export function CallsMobileTable({ calls }: CallsMobileTableProps) {
  return (
    <MobileTable
      items={calls}
      columns={[
        {
          key: 'direction',
          label: 'Direction',
          render: (call) => (
            <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
              {call.direction || 'unknown'}
            </Badge>
          ),
        },
        {
          key: 'from_number',
          label: 'From',
          render: (call) => call.from_number || 'N/A',
        },
        {
          key: 'to_number',
          label: 'To',
          render: (call) => call.to_number || 'N/A',
        },
        {
          key: 'status',
          label: 'Status',
          render: (call) => (
            <Badge variant="outline">{call.status || 'unknown'}</Badge>
          ),
        },
        {
          key: 'duration_seconds',
          label: 'Duration',
          render: (call) => call.duration_seconds ? `${call.duration_seconds}s` : 'N/A',
        },
        {
          key: 'formatted_date',
          label: 'Date',
          render: (call) => call.formatted_date || 'N/A',
        },
      ]}
      emptyMessage="No calls found"
    />
  )
}

