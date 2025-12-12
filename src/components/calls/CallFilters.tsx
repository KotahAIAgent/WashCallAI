'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CallFiltersProps {
  defaultDirection?: string
  defaultStatus?: string
  defaultDateFrom?: string
  defaultDateTo?: string
}

export function CallFilters({ 
  defaultDirection = 'all', 
  defaultStatus = 'all',
  defaultDateFrom,
  defaultDateTo
}: CallFiltersProps) {
  return (
    <form method="get" className="flex flex-wrap gap-4">
      <Select name="direction" defaultValue={defaultDirection}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Directions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Directions</SelectItem>
          <SelectItem value="inbound">Inbound</SelectItem>
          <SelectItem value="outbound">Outbound</SelectItem>
        </SelectContent>
      </Select>
      <Select name="status" defaultValue={defaultStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="queued">Queued</SelectItem>
          <SelectItem value="ringing">Ringing</SelectItem>
          <SelectItem value="answered">Answered</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="voicemail">Voicemail</SelectItem>
        </SelectContent>
      </Select>
      <Input
        type="date"
        name="dateFrom"
        placeholder="From Date"
        defaultValue={defaultDateFrom}
        className="w-[180px]"
      />
      <Input
        type="date"
        name="dateTo"
        placeholder="To Date"
        defaultValue={defaultDateTo}
        className="w-[180px]"
      />
      <Button type="submit">Filter</Button>
    </form>
  )
}

