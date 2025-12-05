'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Download, Loader2, FileSpreadsheet, Calendar } from 'lucide-react'
import { exportLeadsToCSV, exportCallsToCSV, exportCampaignContactsToCSV } from '@/lib/export/actions'

interface ExportButtonProps {
  organizationId: string
  type: 'leads' | 'calls' | 'campaigns'
  campaignId?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ExportButton({ 
  organizationId, 
  type, 
  campaignId,
  variant = 'outline',
  size = 'sm'
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    direction: 'all',
    dateFrom: '',
    dateTo: '',
  })
  const { toast } = useToast()

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (withFilters = false) => {
    setLoading(true)
    setShowFilters(false)

    try {
      let result

      switch (type) {
        case 'leads':
          result = await exportLeadsToCSV(organizationId, withFilters ? {
            status: filters.status !== 'all' ? filters.status : undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
          } : undefined)
          break
        case 'calls':
          result = await exportCallsToCSV(organizationId, withFilters ? {
            direction: filters.direction !== 'all' ? filters.direction : undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
          } : undefined)
          break
        case 'campaigns':
          result = await exportCampaignContactsToCSV(organizationId, campaignId)
          break
      }

      if (result?.error) {
        toast({
          title: 'Export failed',
          description: result.error,
          variant: 'destructive',
        })
      } else if (result?.csv) {
        downloadCSV(result.csv, result.filename)
        toast({
          title: 'Export successful',
          description: `Downloaded ${result.filename}`,
        })
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    }

    setLoading(false)
  }

  const getLabel = () => {
    switch (type) {
      case 'leads': return 'Export Leads'
      case 'calls': return 'Export Calls'
      case 'campaigns': return 'Export Contacts'
    }
  }

  // Simple export for campaigns (no filters needed)
  if (type === 'campaigns') {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(false)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            {getLabel()}
          </>
        )}
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport(false)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export All
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowFilters(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Export with Filters...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export {type === 'leads' ? 'Leads' : 'Calls'}</DialogTitle>
            <DialogDescription>
              Choose filters for your export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {type === 'leads' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="call_back">Call Back</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {type === 'calls' && (
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={filters.direction}
                  onValueChange={(value) => setFilters(f => ({ ...f, direction: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All directions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directions</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleExport(true)} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

