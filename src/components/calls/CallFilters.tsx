'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter, useSearchParams } from 'next/navigation'
import { PhoneIncoming, PhoneOutgoing, Phone } from 'lucide-react'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const handleDirectionChange = (direction: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (direction === 'all') {
      params.delete('direction')
    } else {
      params.set('direction', direction)
    }
    router.push(`/app/calls?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Direction Tabs - Quick Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Call Type</label>
        <Tabs 
          value={defaultDirection} 
          onValueChange={handleDirectionChange}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              All Calls
            </TabsTrigger>
            <TabsTrigger value="inbound" className="flex items-center gap-2">
              <PhoneIncoming className="h-4 w-4" />
              Inbound
            </TabsTrigger>
            <TabsTrigger value="outbound" className="flex items-center gap-2">
              <PhoneOutgoing className="h-4 w-4" />
              Outbound
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Additional Filters */}
      <form method="get" className="flex flex-wrap gap-4">
        <input type="hidden" name="direction" value={defaultDirection} />
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
        <Button type="submit">Apply Filters</Button>
      </form>
    </div>
  )
}


