'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Database } from '@/types/database'
import { deleteContact, updateContactStatus, convertToLead, makeCallForContact, updateContactPhoneNumber } from '@/lib/campaigns/actions'
import { useToast } from '@/hooks/use-toast'
import { 
  Phone, 
  MoreVertical, 
  Trash2, 
  UserPlus, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  PhoneOff,
  Voicemail,
  Edit
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Contact = Database['public']['Tables']['campaign_contacts']['Row']
type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  queued: { label: 'Queued', color: 'bg-blue-100 text-blue-700', icon: Clock },
  calling: { label: 'Calling...', color: 'bg-purple-100 text-purple-700', icon: Phone },
  no_answer: { label: 'No Answer', color: 'bg-amber-100 text-amber-700', icon: PhoneOff },
  voicemail: { label: 'Voicemail', color: 'bg-orange-100 text-orange-700', icon: Voicemail },
  answered: { label: 'Answered', color: 'bg-blue-100 text-blue-700', icon: Phone },
  interested: { label: 'Interested', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  not_interested: { label: 'Not Interested', color: 'bg-red-100 text-red-700', icon: XCircle },
  callback: { label: 'Callback', color: 'bg-cyan-100 text-cyan-700', icon: Clock },
  wrong_number: { label: 'Wrong Number', color: 'bg-gray-100 text-gray-700', icon: PhoneOff },
  do_not_call: { label: 'Do Not Call', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export function CampaignContacts({
  contacts,
  campaignId,
  phoneNumbers,
}: {
  contacts: Contact[]
  campaignId: string
  phoneNumbers: PhoneNumber[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)
  const [callingContactId, setCallingContactId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      (contact.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (contact.business_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter

    return matchesSearch && matchesStatus
  })

  async function handleDelete(contactId: string) {
    setContactToDelete(contactId)
    setDeleteDialogOpen(true)
  }

  async function confirmDelete() {
    if (!contactToDelete) return
    setIsDeleting(true)
    try {
      const result = await deleteContact(contactToDelete, campaignId)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Contact deleted', description: 'The contact has been removed from the campaign' })
        setDeleteDialogOpen(false)
        setContactToDelete(null)
        // Refresh the page to show updated contact list
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleConvertToLead(contactId: string) {
    const result = await convertToLead(contactId, campaignId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Contact converted to lead', description: 'View in Inbound Leads' })
    }
  }

  async function handleStatusChange(contactId: string, newStatus: string) {
    const result = await updateContactStatus(contactId, newStatus, campaignId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    }
  }

  async function handlePhoneNumberChange(contactId: string, phoneNumberId: string | null) {
    const result = await updateContactPhoneNumber(contactId, phoneNumberId, campaignId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Phone number updated', description: 'The contact\'s phone number assignment has been updated' })
      window.location.reload()
    }
  }

  async function handleMakeCall(contactId: string) {
    setCallingContactId(contactId)
    try {
      console.log('[CampaignContacts] Making call for contact:', contactId)
      const result = await makeCallForContact(contactId, campaignId)
      
      if (result.error) {
        console.error('[CampaignContacts] Call error:', result.error)
        toast({ 
          title: 'Call failed', 
          description: result.error, 
          variant: 'destructive' 
        })
      } else {
        console.log('[CampaignContacts] Call initiated successfully')
        toast({ 
          title: 'Call initiated', 
          description: 'The call is being placed now' 
        })
        // Refresh the page to show updated status
        window.location.reload()
      }
    } catch (error) {
      console.error('[CampaignContacts] Unexpected error:', error)
      toast({ 
        title: 'Call failed', 
        description: 'An unexpected error occurred', 
        variant: 'destructive' 
      })
    } finally {
      setCallingContactId(null)
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
        <p className="text-muted-foreground mb-4">
          Add contacts manually or import from a CSV file
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="interested">Interested</option>
          <option value="not_interested">Not Interested</option>
          <option value="no_answer">No Answer</option>
          <option value="voicemail">Voicemail</option>
          <option value="callback">Callback</option>
        </select>
      </div>

      {/* Contacts Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Caller ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Calls</TableHead>
              <TableHead>Last Call</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => {
              const status = statusConfig[contact.status] || statusConfig.pending
              const StatusIcon = status.icon

              return (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {contact.name || contact.business_name || 'Unknown'}
                      </p>
                      {contact.business_name && contact.name && (
                        <p className="text-sm text-muted-foreground">{contact.business_name}</p>
                      )}
                      {contact.city && contact.state && (
                        <p className="text-xs text-muted-foreground">
                          {contact.city}, {contact.state}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                  <TableCell>
                    <Select
                      value={(contact as any).phone_number_id || 'auto'}
                      onValueChange={(value) => handlePhoneNumberChange(contact.id, value === 'auto' ? null : value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Auto-assign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-assign</SelectItem>
                        {phoneNumbers.map((phone) => (
                          <SelectItem key={phone.id} value={phone.id}>
                            {phone.friendly_name || phone.phone_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.call_count}</TableCell>
                  <TableCell>
                    {contact.last_call_at ? (
                      <div className="space-y-1">
                        <div className="text-sm">
                          {format(new Date(contact.last_call_at), 'MMM d, h:mm a')}
                        </div>
                        {contact.status && contact.status !== 'pending' && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              contact.status === 'answered' || contact.status === 'interested' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : contact.status === 'voicemail' || contact.status === 'no_answer'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : contact.status === 'not_interested' || contact.status === 'do_not_call'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : ''
                            }`}
                          >
                            {statusConfig[contact.status]?.label || contact.status}
                          </Badge>
                        )}
                        {contact.last_call_duration && (
                          <div className="text-xs text-muted-foreground">
                            {contact.last_call_duration}s
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(contact.status === 'pending' || contact.status === 'no_answer' || contact.status === 'voicemail') && (
                          <DropdownMenuItem 
                            onClick={() => {
                              if (callingContactId !== contact.id) {
                                handleMakeCall(contact.id)
                              }
                            }}
                            className={callingContactId === contact.id ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            {callingContactId === contact.id ? 'Calling...' : 'Make Call'}
                          </DropdownMenuItem>
                        )}
                        {contact.status === 'interested' && !contact.converted_lead_id && (
                          <DropdownMenuItem onClick={() => handleConvertToLead(contact.id)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Convert to Lead
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'do_not_call')}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Mark Do Not Call
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(contact.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </p>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

