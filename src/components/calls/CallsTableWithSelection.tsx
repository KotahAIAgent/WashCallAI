'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkDeleteButton } from './BulkDeleteButton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
  summary: string | null
  transcript: string | null
  recording_url: string | null
  organization_id: string
}

interface CallsTableWithSelectionProps {
  calls: Call[]
}

export function CallsTableWithSelection({ calls }: CallsTableWithSelectionProps) {
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

  const allSelected = calls.length > 0 && selectedIds.size === calls.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < calls.length

  // Clear selection when calls change (e.g., after deletion)
  useEffect(() => {
    // Only clear if all selected calls are gone
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

      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all calls"
                />
              </TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Your Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No calls found
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(call.id)}
                      onCheckedChange={(checked) => handleSelectOne(call.id, checked as boolean)}
                      aria-label={`Select call ${call.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                      {call.direction || 'unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{call.from_number || 'N/A'}</TableCell>
                  <TableCell>{call.to_number || 'N/A'}</TableCell>
                  <TableCell className="font-medium">
                    {call.organization_phone_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{call.status || 'unknown'}</Badge>
                  </TableCell>
                  <TableCell>{call.duration_seconds ? `${call.duration_seconds}s` : 'N/A'}</TableCell>
                  <TableCell>{call.formatted_date || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CallDetailSheet call={call} />
                      <DeleteCallButton callId={call.id} callDirection={call.direction} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

