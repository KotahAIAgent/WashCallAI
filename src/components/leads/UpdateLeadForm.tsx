'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateLead } from '@/lib/leads/actions'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'
import { useRouter } from 'next/navigation'

type Lead = Database['public']['Tables']['leads']['Row']

export function UpdateLeadForm({ lead }: { lead: Lead }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('leadId', lead.id)
    
    const result = await updateLead(formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      })
      router.refresh()
    }
    
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={lead.name || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={lead.phone || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={lead.email || ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" defaultValue={lead.address || ''} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={lead.city || ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" defaultValue={lead.state || ''} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={lead.status}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="interested">Interested</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
            <SelectItem value="call_back">Call Back</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={lead.notes || ''} rows={4} />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Lead'}
      </Button>
    </form>
  )
}

