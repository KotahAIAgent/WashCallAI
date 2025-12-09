'use client'

import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'

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

interface LeadsTableProps {
  leads: Lead[]
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function LeadsTable({ leads, selectedIds = [], onSelectionChange }: LeadsTableProps) {
  const handleSelect = (leadId: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedIds, leadId])
    } else {
      onSelectionChange(selectedIds.filter(id => id !== leadId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(leads.map(lead => lead.id))
    } else {
      onSelectionChange([])
    }
  }

  const allSelected = selectedIds.length === leads.length && leads.length > 0
  const someSelected = selectedIds.length > 0 && selectedIds.length < leads.length

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {onSelectionChange && (
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
          )}
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="hidden lg:table-cell">Email</TableHead>
          <TableHead className="hidden lg:table-cell">Property Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden lg:table-cell">Created</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.length === 0 ? (
          <TableRow>
            <TableCell colSpan={onSelectionChange ? 8 : 7} className="text-center text-muted-foreground">
              No leads found
            </TableCell>
          </TableRow>
        ) : (
          leads.map((lead, index) => (
            <motion.tr
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="border-b transition-colors hover:bg-muted/50"
            >
              {onSelectionChange && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(lead.id)}
                    onCheckedChange={(checked) => handleSelect(lead.id, checked as boolean)}
                    aria-label={`Select ${lead.name || 'lead'}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">{lead.name || 'N/A'}</TableCell>
              <TableCell>{lead.phone || 'N/A'}</TableCell>
              <TableCell className="hidden lg:table-cell">{lead.email || 'N/A'}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {lead.property_type ? (
                  <Badge variant="outline">{lead.property_type}</Badge>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[lead.status] || 'outline'}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {format(new Date(lead.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Link href={`/app/leads/${lead.id}`}>
                  <Button variant="ghost" size="sm">
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </motion.tr>
          ))
        )}
      </TableBody>
    </Table>
  )
}

