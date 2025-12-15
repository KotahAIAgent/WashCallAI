'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { assignPhoneNumberToAssistant } from '@/lib/assistants/phone-assignment'
import { useToast } from '@/hooks/use-toast'
import { Phone, Loader2 } from 'lucide-react'
import { Database } from '@/types/database'

type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

interface AssignPhoneNumberDialogProps {
  assistantId: string
  assistantType: 'inbound' | 'outbound'
  organizationId: string
}

export function AssignPhoneNumberDialog({
  assistantId,
  assistantType,
  organizationId,
}: AssignPhoneNumberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [loadingPhones, setLoadingPhones] = useState(true)
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    async function fetchPhoneNumbers() {
      try {
        const response = await fetch(`/api/phone-numbers?organizationId=${organizationId}`)
        if (response.ok) {
          const data = await response.json()
          // Filter to only show phone numbers that support the assistant type
          const filtered = assistantType === 'inbound'
            ? data.phoneNumbers.filter((p: PhoneNumber) => ['inbound', 'both'].includes(p.type || ''))
            : data.phoneNumbers.filter((p: PhoneNumber) => ['outbound', 'both'].includes(p.type || ''))
          setPhoneNumbers(filtered)
        }
      } catch (error) {
        console.error('Failed to fetch phone numbers:', error)
      } finally {
        setLoadingPhones(false)
      }
    }

    if (open) {
      fetchPhoneNumbers()
    }
  }, [open, organizationId, assistantType])

  async function handleAssign() {
    if (!selectedPhoneId) {
      toast({
        title: 'Error',
        description: 'Please select a phone number',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const result = await assignPhoneNumberToAssistant(
      organizationId,
      assistantId,
      selectedPhoneId
    )

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Phone number assigned successfully',
      })
      setOpen(false)
      setSelectedPhoneId('')
      // Refresh the page to show updated assignments
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Phone className="h-4 w-4 mr-2" />
          {assistantType === 'inbound' ? 'Assign Phone Number' : 'View Phone Numbers'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {assistantType === 'inbound' ? 'Assign Phone Number' : 'Phone Numbers'}
          </DialogTitle>
          <DialogDescription>
            {assistantType === 'inbound'
              ? 'Assign a phone number to this assistant to handle incoming calls'
              : 'Outbound assistants use phone numbers when making calls through campaigns'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {assistantType === 'inbound' && (
            <div className="space-y-2">
              <Label>Assign Phone Number</Label>
              {loadingPhones ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading phone numbers...
                </div>
              ) : phoneNumbers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No phone numbers available. Purchase a phone number first.
                </p>
              ) : (
                <>
                  <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a phone number" />
                    </SelectTrigger>
                    <SelectContent>
                      {phoneNumbers.map((phone) => (
                        <SelectItem key={phone.id} value={phone.id}>
                          {phone.friendly_name || phone.phone_number} ({phone.phone_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssign}
                    disabled={loading || !selectedPhoneId}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Phone Number'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will assign the assistant to handle incoming calls on the selected phone number.
                  </p>
                </>
              )}
            </div>
          )}

          {assistantType === 'outbound' && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Outbound assistants don't need to be assigned to phone numbers. They automatically 
                use phone numbers when making calls through campaigns. The phone number is selected 
                when you create or configure a campaign.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

