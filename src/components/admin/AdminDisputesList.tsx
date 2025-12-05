'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { reviewDispute, getDisputeDetails } from '@/lib/disputes/actions'
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Play, 
  Building2,
  Phone,
  FileText
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Dispute {
  id: string
  created_at: string
  call_date: string
  call_duration: number | null
  call_outcome: string
  phone_number: string | null
  reason: string
  status: 'pending' | 'approved' | 'denied'
  admin_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  organizations: {
    id: string
    name: string
    email: string | null
  } | null
}

interface DisputeDetails extends Dispute {
  calls: {
    id: string
    recording_url: string | null
    transcript: string | null
    summary: string | null
    duration_seconds: number | null
  } | null
  campaign_contacts: {
    id: string
    name: string | null
    phone: string
    last_call_summary: string | null
    last_call_transcript: string | null
    last_call_duration: number | null
  } | null
}

interface Props {
  disputes: Dispute[]
  adminEmail: string
}

export function AdminDisputesList({ disputes, adminEmail }: Props) {
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetails | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Filter options
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending')

  const filteredDisputes = disputes.filter(d => 
    filter === 'all' ? true : d.status === filter
  )

  const handleViewDispute = async (disputeId: string) => {
    setIsLoading(true)
    try {
      const result = await getDisputeDetails(disputeId)
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        setSelectedDispute(result.dispute as DisputeDetails)
        setAdminNotes(result.dispute?.admin_notes || '')
        setIsDialogOpen(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (status: 'approved' | 'denied') => {
    if (!selectedDispute) return

    setIsSubmitting(true)
    try {
      const result = await reviewDispute({
        disputeId: selectedDispute.id,
        status,
        adminNotes: adminNotes.trim() || undefined,
        adminEmail,
      })

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: status === 'approved' ? 'Dispute Approved' : 'Dispute Denied',
          description: status === 'approved' 
            ? 'The call credit has been refunded to the customer.'
            : 'The dispute has been denied.',
        })
        setIsDialogOpen(false)
        window.location.reload()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (disputes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
        <p>No disputes to review!</p>
        <p className="text-sm mt-1">All caught up. 🎉</p>
      </div>
    )
  }

  return (
    <>
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {disputes.filter(d => d.status === 'pending').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                {disputes.filter(d => d.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="denied">Denied</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredDisputes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {filter} disputes.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Call Date</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDisputes.map((dispute) => (
              <TableRow key={dispute.id}>
                <TableCell className="text-sm">
                  {formatDistanceToNow(new Date(dispute.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">
                        {dispute.organizations?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dispute.organizations?.email || '-'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(dispute.call_date), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {dispute.call_outcome}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-sm truncate" title={dispute.reason}>
                    {dispute.reason}
                  </p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={dispute.status} />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={dispute.status === 'pending' ? 'default' : 'outline'}
                    onClick={() => handleViewDispute(dispute.id)}
                    disabled={isLoading}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {dispute.status === 'pending' ? 'Review' : 'View'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDispute?.status === 'pending' ? 'Review Dispute' : 'Dispute Details'}
            </DialogTitle>
            <DialogDescription>
              Review the call details and customer's reason for dispute.
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Organization Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{selectedDispute.organizations?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2">{selectedDispute.organizations?.email || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Call Details */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <span className="ml-2">{format(new Date(selectedDispute.call_date), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2 font-mono">{selectedDispute.phone_number || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2">{selectedDispute.call_duration ? `${selectedDispute.call_duration}s` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Outcome:</span>
                    <Badge variant="outline" className="ml-2 capitalize">{selectedDispute.call_outcome}</Badge>
                  </div>
                </div>

                {/* Recording */}
                {selectedDispute.calls?.recording_url && (
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">Recording</Label>
                    <audio controls className="w-full">
                      <source src={selectedDispute.calls.recording_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}

                {/* Summary */}
                {(selectedDispute.calls?.summary || selectedDispute.campaign_contacts?.last_call_summary) && (
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">AI Summary</Label>
                    <p className="text-sm bg-background p-3 rounded border">
                      {selectedDispute.calls?.summary || selectedDispute.campaign_contacts?.last_call_summary}
                    </p>
                  </div>
                )}

                {/* Transcript */}
                {(selectedDispute.calls?.transcript || selectedDispute.campaign_contacts?.last_call_transcript) && (
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground mb-2 block">Transcript</Label>
                    <div className="text-sm bg-background p-3 rounded border max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">
                        {selectedDispute.calls?.transcript || selectedDispute.campaign_contacts?.last_call_transcript}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer's Reason */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Customer's Reason for Dispute
                </h4>
                <p className="text-sm">{selectedDispute.reason}</p>
              </div>

              {/* Admin Notes */}
              {selectedDispute.status === 'pending' ? (
                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Add notes about your decision (these will be visible to the customer)"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                selectedDispute.admin_notes && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Admin Notes</Label>
                    <p className="text-sm bg-muted p-3 rounded">{selectedDispute.admin_notes}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reviewed by {selectedDispute.reviewed_by} on {format(new Date(selectedDispute.reviewed_at!), 'MMM d, yyyy')}
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          <DialogFooter>
            {selectedDispute?.status === 'pending' ? (
              <>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview('denied')}
                  disabled={isSubmitting}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Deny
                </Button>
                <Button
                  onClick={() => handleReview('approved')}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve & Refund Credit
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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

