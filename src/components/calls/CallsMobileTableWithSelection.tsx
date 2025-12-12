'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkDeleteButton } from './BulkDeleteButton'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileTable } from '@/components/ui/mobile-table'
import { CallDetailSheet } from '@/components/dashboard/CallDetailSheet'
import { DeleteCallButton } from '@/components/calls/DeleteCallButton'

interface Call {
  id: string
  direction: string
  status: string
  from_number: string | null
  to_number: string | null
  organization_phone_number: string | null
  duration_seconds: number | null
  formatted_date: string
}

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
              render: (call) => (
                <Checkbox
                  checked={selectedIds.has(call.id)}
                  onCheckedChange={(checked) => handleSelectOne(call.id, checked as boolean)}
                  aria-label={`Select call ${call.id}`}
                />
              ),
            },
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
              key: 'organization_phone_number',
              label: 'Your Number',
              render: (call) => (
                <span className="font-medium">{call.organization_phone_number || 'N/A'}</span>
              ),
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
            {
              key: 'actions',
              label: 'Actions',
              render: (call) => (
                <div className="flex items-center gap-2">
                  <CallDetailSheet call={call} />
                  <DeleteCallButton callId={call.id} callDirection={call.direction} />
                </div>
              ),
            },
          ]}
          emptyMessage="No calls found"
        />
      </div>
    </div>
  )
}

