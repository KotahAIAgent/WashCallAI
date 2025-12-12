'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { addContact } from '@/lib/campaigns/actions'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2 } from 'lucide-react'
import { Database } from '@/types/database'

type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

export function AddContactDialog({
  campaignId,
  organizationId,
  phoneNumbers,
}: {
  campaignId: string
  organizationId: string
  phoneNumbers: PhoneNumber[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('campaignId', campaignId)
    formData.append('organizationId', organizationId)
    
    // Convert "auto" to empty string (which becomes null in the action)
    const phoneNumberId = formData.get('phoneNumberId') as string
    if (phoneNumberId === 'auto') {
      formData.set('phoneNumberId', '')
    }
    
    const result = await addContact(formData)
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Contact added successfully' })
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to this campaign
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone" 
                name="phone" 
                placeholder="1234567890 or +1234567890" 
                required 
              />
              <p className="text-xs text-muted-foreground">
                Enter 10 digits (e.g., 1234567890) or with country code (e.g., +1234567890)
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" name="businessName" placeholder="ABC Restaurant" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="john@example.com" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" placeholder="Houston" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" placeholder="TX" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" placeholder="123 Main St" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Any notes about this contact..." rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumberId">Caller ID (Phone Number)</Label>
            <Select name="phoneNumberId" defaultValue="auto">
              <SelectTrigger>
                <SelectValue placeholder="Auto-assign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-assign (uses campaign default)</SelectItem>
                {phoneNumbers.map((phone) => (
                  <SelectItem key={phone.id} value={phone.id}>
                    {phone.friendly_name || phone.phone_number} ({phone.phone_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Assign a specific phone number to this contact, or leave as auto-assign to use the campaign's default
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Contact'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

