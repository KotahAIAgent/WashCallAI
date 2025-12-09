'use client'

import { useState } from 'react'
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
import { deleteContact, updateContactStatus, convertToLead } from '@/lib/campaigns/actions'
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
  Voicemail
} from 'lucide-react'
import { format } from 'date-fns'

type Contact = Database['public']['Tables']['campaign_contacts']['Row']

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
}: {
  contacts: Contact[]
  campaignId: string
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)
  const { toast } = useToast()

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
    const result = await deleteContact(contactToDelete, campaignId)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Contact deleted' })
    }
    setContactToDelete(null)
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
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.call_count}</TableCell>
                  <TableCell>
                    {contact.last_call_at ? (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(contact.last_call_at), 'MMM d, h:mm a')}
                      </span>
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
    </div>
  )
}

