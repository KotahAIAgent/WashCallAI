'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { exportLeadsToCSV, exportCallsToCSV, exportCampaignContactsToCSV } from '@/lib/export/actions'

interface ExportDialogProps {
  organizationId: string
  type: 'leads' | 'calls' | 'campaigns'
  campaignId?: string
}

export function ExportDialog({ organizationId, type, campaignId }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [status, setStatus] = useState('all')
  const [direction, setDirection] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      let result: { csv?: string; filename?: string; error?: string }

      switch (type) {
        case 'leads':
          result = await exportLeadsToCSV(organizationId, {
            status: status !== 'all' ? status : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          })
          break
        case 'calls':
          result = await exportCallsToCSV(organizationId, {
            direction: direction !== 'all' ? direction : undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          })
          break
        case 'campaigns':
          result = await exportCampaignContactsToCSV(organizationId, campaignId)
          break
        default:
          result = { error: 'Invalid export type' }
      }

      if (result.error) {
        toast({
          title: 'Export Failed',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      if (result.csv && result.filename) {
        // Create and download the file
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
          title: 'Export Complete',
          description: `${result.filename} has been downloaded.`,
        })
        setIsOpen(false)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'leads': return 'Export Leads'
      case 'calls': return 'Export Calls'
      case 'campaigns': return 'Export Campaign Contacts'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            Download your data as a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {type === 'leads' && (
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Direction Filter</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="inbound">Inbound Only</SelectItem>
                  <SelectItem value="outbound">Outbound Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== 'campaigns' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

