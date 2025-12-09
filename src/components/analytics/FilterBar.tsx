'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from './DateRangePicker'
import { X } from 'lucide-react'
import { subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface FilterBarProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  statusFilter?: string
  onStatusFilterChange?: (status: string) => void
  onReset?: () => void
}

export function FilterBar({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
}: FilterBarProps) {
  const handleQuickSelect = (days: number) => {
    const to = new Date()
    const from = subDays(to, days)
    onDateRangeChange({ from, to })
  }

  const handleMonthSelect = (monthsAgo: number) => {
    const targetMonth = subMonths(new Date(), monthsAgo)
    const from = startOfMonth(targetMonth)
    const to = endOfMonth(targetMonth)
    onDateRangeChange({ from, to })
  }

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Quick Select:</span>
        <Button variant="outline" size="sm" onClick={() => handleQuickSelect(7)}>
          Last 7 days
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickSelect(30)}>
          Last 30 days
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleQuickSelect(90)}>
          Last 90 days
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleMonthSelect(0)}>
          This Month
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleMonthSelect(1)}>
          Last Month
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
      </div>

      {onStatusFilterChange && (
        <Select value={statusFilter || 'all'} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
      )}

      {(dateRange.from || dateRange.to || statusFilter) && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}

