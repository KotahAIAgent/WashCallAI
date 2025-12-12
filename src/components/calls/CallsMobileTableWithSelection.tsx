'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkDeleteButton } from './BulkDeleteButton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileTable } from '@/components/ui/mobile-table'
import { CallDetailSheet } from '@/components/dashboard/CallDetailSheet'
import { DeleteCallButton } from '@/components/calls/DeleteCallButton'
import { Database } from '@/types/database'

type Call = Database['public']['Tables']['calls']['Row']

interface CallsMobileTableWithSelectionProps {
  calls: Call[]
}

export function CallsMobileTableWithSelection({ calls }: CallsMobileTableWithSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(calls.map(call => call.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (callId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(callId)
    } else {
      newSelected.delete(callId)
    }
    setSelectedIds(newSelected)
  }

  // Clear selection when calls change (e.g., after deletion)
  useEffect(() => {
    const remainingSelected = calls.filter(call => selectedIds.has(call.id))
    if (remainingSelected.length === 0 && selectedIds.size > 0) {
      setSelectedIds(new Set())
    }
  }, [calls, selectedIds])

  const selectedIdsArray = Array.from(selectedIds)

  // Create a map for quick lookup of full call objects
  const callsMap = new Map(calls.map(call => [call.id, call]))

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} call(s) selected
          </span>
          <BulkDeleteButton
            selectedIds={selectedIdsArray}
            onClearSelection={() => setSelectedIds(new Set())}
          />
        </div>
      )}

      <div className="block md:hidden">
        <div className="mb-4 flex items-center gap-2 p-2 border-b">
          <Checkbox
            checked={calls.length > 0 && selectedIds.size === calls.length}
            onCheckedChange={handleSelectAll}
            aria-label="Select all calls"
          />
          <span className="text-sm font-medium">Select All</span>
        </div>
        <MobileTable
          items={calls}
          columns={[
            {
              key: 'checkbox',
              label: '',
              render: (item) => {
                const callId = item.id as string
                return (
                  <Checkbox
                    checked={selectedIds.has(callId)}
                    onCheckedChange={(checked) => handleSelectOne(callId, checked as boolean)}
                    aria-label={`Select call ${callId}`}
                  />
                )
              },
            },
            {
              key: 'direction',
              label: 'Direction',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                return (
                  <Badge variant={call?.direction === 'inbound' ? 'default' : 'secondary'}>
                    {call?.direction || 'unknown'}
                  </Badge>
                )
              },
            },
            {
              key: 'from_number',
              label: 'From',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                return call?.from_number || 'N/A'
              },
            },
            {
              key: 'to_number',
              label: 'To',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                return call?.to_number || 'N/A'
              },
            },
            {
              key: 'organization_phone_number',
              label: 'Your Number',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                return (
                  <span className="font-medium">{call?.organization_phone_number || 'N/A'}</span>
                )
              },
            },
            {
              key: 'status',
              label: 'Status',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                return (
                  <Badge variant="outline">{call?.status || 'unknown'}</Badge>
                )
              },
            },
            {
              key: 'duration_seconds',
              label: 'Duration',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                return call?.duration_seconds ? `${call.duration_seconds}s` : 'N/A'
              },
            },
            {
              key: 'formatted_date',
              label: 'Date',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                if (call?.created_at) {
                  try {
                    const date = new Date(call.created_at)
                    if (!isNaN(date.getTime())) {
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    }
                  } catch (e) {
                    // Fall through to N/A
                  }
                }
                return 'N/A'
              },
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (item) => {
                const call = callsMap.get(item.id as string)
                if (!call) return null
                return (
                  <div className="flex items-center gap-2">
                    <CallDetailSheet call={call} />
                    <DeleteCallButton callId={call.id} callDirection={call.direction || 'unknown'} />
                  </div>
                )
              },
            },
          ]}
          emptyMessage="No calls found"
        />
      </div>
    </div>
  )
}

