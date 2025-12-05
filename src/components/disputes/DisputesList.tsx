'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'

interface Dispute {
  id: string
  created_at: string
  call_date: string
  call_outcome: string
  phone_number: string | null
  reason: string
  status: 'pending' | 'approved' | 'denied'
  admin_notes: string | null
  reviewed_at: string | null
}

interface DisputesListProps {
  disputes: Dispute[]
}

export function DisputesList({ disputes }: DisputesListProps) {
  if (disputes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <HelpCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p>No disputes submitted yet.</p>
        <p className="text-sm mt-1">
          If you believe any call was incorrectly charged, you can request a review below.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Submitted</TableHead>
          <TableHead>Call Date</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admin Response</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {disputes.map((dispute) => (
          <TableRow key={dispute.id}>
            <TableCell className="text-sm">
              {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
            </TableCell>
            <TableCell className="text-sm">
              {format(new Date(dispute.call_date), 'MMM d, yyyy h:mm a')}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {dispute.call_outcome}
              </Badge>
            </TableCell>
            <TableCell className="text-sm font-mono">
              {dispute.phone_number || '-'}
            </TableCell>
            <TableCell className="max-w-[200px]">
              <p className="text-sm truncate" title={dispute.reason}>
                {dispute.reason}
              </p>
            </TableCell>
            <TableCell>
              <StatusBadge status={dispute.status} />
            </TableCell>
            <TableCell className="max-w-[200px]">
              {dispute.admin_notes ? (
                <p className="text-sm text-muted-foreground truncate" title={dispute.admin_notes}>
                  {dispute.admin_notes}
                </p>
              ) : dispute.status === 'pending' ? (
                <span className="text-sm text-muted-foreground italic">Awaiting review...</span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'denied' }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    case 'denied':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Denied
        </Badge>
      )
  }
}

