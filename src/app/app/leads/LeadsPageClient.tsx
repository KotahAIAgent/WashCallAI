'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/export/ExportButton'
import { LeadsTable } from '@/components/leads/LeadsTable'
import { MobileTable } from '@/components/ui/mobile-table'
import { BulkActions } from '@/components/leads/BulkActions'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

const statusColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  interested: 'default',
  not_interested: 'outline',
  call_back: 'secondary',
  booked: 'default',
  customer: 'default',
}

interface Lead {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  property_type: string | null
  status: string
  created_at: string
}

interface LeadsPageClientProps {
  leads: Lead[]
  organizationId: string
  initialStatus?: string
}

export function LeadsPageClient({ leads, organizationId, initialStatus }: LeadsPageClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleBulkDelete = async (ids: string[]) => {
    // This would call a server action
    console.log('Bulk delete:', ids)
  }

  const handleBulkTag = async (ids: string[]) => {
    // This would call a server action
    console.log('Bulk tag:', ids)
  }

  const handleBulkExport = async (ids: string[]) => {
    // This would call a server action
    console.log('Bulk export:', ids)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Inbound Leads</h2>
          <p className="text-sm text-muted-foreground">
            Leads captured from inbound calls and inquiries
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <BulkActions
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onBulkDelete={handleBulkDelete}
              onBulkTag={handleBulkTag}
              onBulkExport={handleBulkExport}
              totalItems={leads.length}
            />
          )}
          <ExportButton organizationId={organizationId} type="leads" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Inbound Leads</CardTitle>
          <CardDescription>Leads from inbound calls - filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <form method="get" className="flex flex-col sm:flex-row gap-2">
              <Select name="status" defaultValue={initialStatus || 'all'}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
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
              <Button type="submit" className="w-full sm:w-auto">Filter</Button>
            </form>
          </div>
          
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <MobileTable
              items={leads}
              columns={[
                {
                  key: 'name',
                  label: 'Name',
                  render: (lead) => (
                    <div>
                      <div className="font-medium">{lead.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground mt-1">{lead.phone || 'No phone'}</div>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (lead) => (
                    <Badge variant={statusColors[lead.status] || 'outline'}>
                      {lead.status}
                    </Badge>
                  ),
                },
                {
                  key: 'created_at',
                  label: 'Created',
                  render: (lead) => format(new Date(lead.created_at), 'MMM d, yyyy'),
                },
                {
                  key: 'property_type',
                  label: 'Property Type',
                  render: (lead) => lead.property_type ? (
                    <Badge variant="outline" className="text-xs">{lead.property_type}</Badge>
                  ) : 'N/A',
                },
              ]}
              getItemHref={(lead) => `/app/leads/${lead.id}`}
              emptyMessage="No leads found"
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <LeadsTable 
              leads={leads} 
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

