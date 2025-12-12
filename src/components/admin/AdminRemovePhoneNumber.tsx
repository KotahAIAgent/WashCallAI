'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminRemovePhoneNumber } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'
import { Phone, Trash2, Loader2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Organization {
  id: string
  name: string
  phone_numbers: {
    id: string
    phone_number: string
    friendly_name: string | null
    type: string
    active: boolean
  }[] | null
}

export function AdminRemovePhoneNumber({ organizations }: { organizations: Organization[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedPhoneId, setSelectedPhoneId] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast } = useToast()

  // Get selected organization's phone numbers
  const selectedOrgData = organizations.find(org => org.id === selectedOrg)
  const availablePhones = selectedOrgData?.phone_numbers?.filter(p => p.active) || []

  const handleRemove = async () => {
    if (!selectedPhoneId) {
      toast({
        title: 'Error',
        description: 'Please select a phone number to remove',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const result = await adminRemovePhoneNumber(selectedPhoneId, 'admin@washcallai.com')
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: result.message || 'Phone number removed successfully',
      })
      // Reset form
      setSelectedOrg('')
      setSelectedPhoneId('')
    }
    setLoading(false)
    setShowConfirm(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          Remove Phone Number
        </CardTitle>
        <CardDescription>
          Remove a phone number from an organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={selectedOrg} onValueChange={(value) => {
              setSelectedOrg(value)
              setSelectedPhoneId('') // Reset phone selection when org changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations
                  .filter(org => org.phone_numbers && org.phone_numbers.length > 0)
                  .map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name} ({org.phone_numbers?.length || 0} numbers)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrg && availablePhones.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Select value={selectedPhoneId} onValueChange={setSelectedPhoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {availablePhones.map((phone) => (
                    <SelectItem key={phone.id} value={phone.id}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{phone.phone_number}</span>
                        {phone.friendly_name && (
                          <span className="text-muted-foreground">({phone.friendly_name})</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-2">- {phone.type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedOrg && availablePhones.length === 0 && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              This organization has no active phone numbers to remove.
            </div>
          )}

          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            disabled={loading || !selectedPhoneId}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Phone Number
              </>
            )}
          </Button>
        </div>

        <ConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Remove Phone Number"
          description={`Are you sure you want to remove this phone number? This will:
          
• Remove the phone number from the organization
• Unassign any Vapi assistant from the phone number
• This action cannot be undone

The phone number will no longer be able to receive or make calls.`}
          confirmLabel="Remove"
          variant="destructive"
          onConfirm={handleRemove}
        />
      </CardContent>
    </Card>
  )
}

