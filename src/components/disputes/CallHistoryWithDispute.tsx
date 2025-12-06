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
import { submitDispute } from '@/lib/disputes/actions'
import { BILLABLE_STATUSES } from '@/lib/disputes/constants'
import { AlertTriangle, Phone, Play, CheckCircle2, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Call {
  id: string
  created_at: string
  to_number: string | null
  status: string
  duration_seconds: number | null
  recording_url: string | null
  summary: string | null
}

interface CampaignContact {
  id: string
  created_at: string
  name: string | null
  phone: string
  status: string
  last_call_at: string | null
  last_call_duration: number | null
  last_call_summary: string | null
  campaigns: { name: string } | null
}

interface Dispute {
  id: string
  call_id: string | null
  campaign_contact_id: string | null
}

interface Props {
  calls: Call[]
  campaignContacts: CampaignContact[]
  organizationId: string
  existingDisputes: Dispute[]
}

export function CallHistoryWithDispute({ calls, campaignContacts, organizationId, existingDisputes }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{
    type: 'call' | 'contact'
    data: Call | CampaignContact
  } | null>(null)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const hasExistingDispute = (type: 'call' | 'contact', id: string) => {
    return existingDisputes.some(d => 
      type === 'call' ? d.call_id === id : d.campaign_contact_id === id
    )
  }

  const isBillableStatus = (status: string) => {
    return BILLABLE_STATUSES.includes(status.toLowerCase())
  }

  const handleRequestReview = (type: 'call' | 'contact', data: Call | CampaignContact) => {
    setSelectedItem({ type, data })
    setReason('')
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedItem || !reason.trim()) return

    setIsSubmitting(true)
    try {
      const result = await submitDispute({
        organizationId,
        callId: selectedItem.type === 'call' ? (selectedItem.data as Call).id : undefined,
        campaignContactId: selectedItem.type === 'contact' ? (selectedItem.data as CampaignContact).id : undefined,
        callDate: selectedItem.type === 'call' 
          ? (selectedItem.data as Call).created_at
          : (selectedItem.data as CampaignContact).last_call_at || (selectedItem.data as CampaignContact).created_at,
        callDuration: selectedItem.type === 'call'
          ? (selectedItem.data as Call).duration_seconds || undefined
          : (selectedItem.data as CampaignContact).last_call_duration || undefined,
        callOutcome: selectedItem.data.status,
        phoneNumber: selectedItem.type === 'call'
          ? (selectedItem.data as Call).to_number || undefined
          : (selectedItem.data as CampaignContact).phone,
        reason: reason.trim(),
      })

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Dispute Submitted',
          description: 'Your dispute has been submitted for review. We typically respond within 24-48 hours.',
        })
        setIsDialogOpen(false)
        // Refresh page to show updated disputes list
        window.location.reload()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Tabs defaultValue="calls" className="w-full">
        <TabsList>
          <TabsTrigger value="calls">Direct Calls ({calls.length})</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Calls ({campaignContacts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calls">
          {calls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No outbound calls found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Billable?</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => {
                  const billable = isBillableStatus(call.status)
                  const disputed = hasExistingDispute('call', call.id)
                  
                  return (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(call.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(call.created_at), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {call.to_number || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.duration_seconds ? `${Math.round(call.duration_seconds)}s` : '-'}
                      </TableCell>
                      <TableCell>
                        {billable ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {call.recording_url ? (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={call.recording_url} target="_blank" rel="noopener noreferrer">
                              <Play className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {billable && !disputed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestReview('call', call)}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Request Review
                          </Button>
                        )}
                        {disputed && (
                          <Badge variant="outline" className="text-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Under Review
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          {campaignContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>No campaign calls found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Last Call</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Billable?</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignContacts.map((contact) => {
                  const billable = isBillableStatus(contact.status)
                  const disputed = hasExistingDispute('contact', contact.id)
                  
                  return (
                    <TableRow key={contact.id}>
                      <TableCell>
                        {contact.last_call_at ? (
                          <>
                            <div className="text-sm">
                              {format(new Date(contact.last_call_at), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(contact.last_call_at), 'h:mm a')}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{contact.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground font-mono">{contact.phone}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {contact.campaigns?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {contact.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contact.last_call_duration ? `${contact.last_call_duration}s` : '-'}
                      </TableCell>
                      <TableCell>
                        {billable ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {billable && !disputed && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestReview('contact', contact)}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Request Review
                          </Button>
                        )}
                        {disputed && (
                          <Badge variant="outline" className="text-yellow-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Under Review
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Dispute Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Call Review</DialogTitle>
            <DialogDescription>
              Explain why you believe this call should not count toward your monthly limit.
              Our team will review the call recording and respond within 24-48 hours.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-mono">
                    {selectedItem.type === 'call' 
                      ? (selectedItem.data as Call).to_number 
                      : (selectedItem.data as CampaignContact).phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Outcome:</span>
                  <Badge variant="outline" className="capitalize">{selectedItem.data.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>
                    {selectedItem.type === 'call'
                      ? (selectedItem.data as Call).duration_seconds 
                        ? `${(selectedItem.data as Call).duration_seconds}s`
                        : '-'
                      : (selectedItem.data as CampaignContact).last_call_duration
                        ? `${(selectedItem.data as CampaignContact).last_call_duration}s`
                        : '-'
                    }
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for dispute</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., The call went to voicemail but was marked as answered, The person who answered wasn't the intended contact, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Be specific - this helps us review faster.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

