'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminUpdatePhoneNumber } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'
import { Phone, Loader2, Edit } from 'lucide-react'

interface PhoneNumber {
  id: string
  phone_number: string
  provider_phone_id: string | null
  friendly_name: string | null
  type: 'inbound' | 'outbound' | 'both'
  organization_id: string
}

interface Organization {
  id: string
  name: string
  phone_numbers?: PhoneNumber[]
}

export function AdminUpdatePhoneNumber({ organizations }: { organizations: Organization[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedPhone, setSelectedPhone] = useState('')
  const [providerPhoneId, setProviderPhoneId] = useState('')
  const [friendlyName, setFriendlyName] = useState('')
  const [phoneType, setPhoneType] = useState<'inbound' | 'outbound' | 'both' | ''>('')
  const [dailyLimit, setDailyLimit] = useState('')
  const { toast } = useToast()

  // Get phone numbers for selected organization
  const org = organizations.find(o => o.id === selectedOrg)
  const phoneNumbers = org?.phone_numbers || []

  // When phone number is selected, populate form
  const selectedPhoneData = phoneNumbers.find(p => p.id === selectedPhone)
  
  // Update form when phone number is selected
  useState(() => {
    if (selectedPhoneData) {
      setProviderPhoneId(selectedPhoneData.provider_phone_id || '')
      setFriendlyName(selectedPhoneData.friendly_name || '')
      setPhoneType(selectedPhoneData.type)
      // Note: dailyLimit not stored in phone number data, would need to fetch separately
    }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedOrg || !selectedPhone) {
      toast({
        title: 'Error',
        description: 'Please select an organization and phone number',
        variant: 'destructive',
      })
      return
    }

    // Validate UUID format for provider_phone_id if provided
    if (providerPhoneId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(providerPhoneId.trim())) {
        toast({
          title: 'Invalid Phone Number ID',
          description: 'Vapi Phone Number ID must be a UUID (e.g., 123e4567-e89b-12d3-a456-426614174000). Get it from Vapi Dashboard → Phone Numbers → Click on your number → Copy the ID.',
          variant: 'destructive',
        })
        return
      }
    }

    setLoading(true)
    const result = await adminUpdatePhoneNumber(
      selectedPhone,
      providerPhoneId.trim() || undefined,
      friendlyName || undefined,
      phoneType || undefined,
      dailyLimit ? parseInt(dailyLimit) : undefined
    )
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Phone number updated successfully',
      })
      // Reset form
      setProviderPhoneId('')
      setFriendlyName('')
      setPhoneType('')
      setDailyLimit('')
      setSelectedPhone('')
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Update Phone Number
        </CardTitle>
        <CardDescription>
          Fix phone number IDs or update phone number settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Organization</Label>
            <Select value={selectedOrg} onValueChange={(v) => {
              setSelectedOrg(v)
              setSelectedPhone('')
              setProviderPhoneId('')
              setFriendlyName('')
              setPhoneType('')
              setDailyLimit('')
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrg && (
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Select value={selectedPhone} onValueChange={(v) => {
                setSelectedPhone(v)
                const phone = phoneNumbers.find(p => p.id === v)
                if (phone) {
                  setProviderPhoneId(phone.provider_phone_id || '')
                  setFriendlyName(phone.friendly_name || '')
                  setPhoneType(phone.type)
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phone number" />
                </SelectTrigger>
                <SelectContent>
                  {phoneNumbers.map((phone) => (
                    <SelectItem key={phone.id} value={phone.id}>
                      {phone.phone_number} {phone.friendly_name ? `(${phone.friendly_name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {phoneNumbers.length === 0 && (
                <p className="text-xs text-muted-foreground">No phone numbers found for this organization</p>
              )}
            </div>
          )}

          {selectedPhone && (
            <>
              <div className="space-y-2">
                <Label>Vapi Phone Number ID <span className="text-red-500">*</span></Label>
                <Input
                  value={providerPhoneId}
                  onChange={(e) => setProviderPhoneId(e.target.value)}
                  placeholder="123e4567-e89b-12d3-a456-426614174000"
                  className={providerPhoneId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerPhoneId.trim()) ? 'border-red-500' : ''}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Must be a UUID format. Get it from:
                  </p>
                  <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5 ml-2">
                    <li>Go to <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Vapi Dashboard</a></li>
                    <li>Navigate to <strong>Phone Numbers</strong></li>
                    <li>Click on your phone number</li>
                    <li>Copy the <strong>ID</strong> field (UUID format)</li>
                  </ol>
                  {providerPhoneId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerPhoneId.trim()) && (
                    <p className="text-xs text-red-500 mt-1">
                      ⚠️ Invalid UUID format. Must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Friendly Name (Optional)</Label>
                <Input
                  value={friendlyName}
                  onChange={(e) => setFriendlyName(e.target.value)}
                  placeholder="Main Line, Backup #1, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={phoneType} onValueChange={(v) => setPhoneType(v as 'inbound' | 'outbound' | 'both')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound Only</SelectItem>
                      <SelectItem value="outbound">Outbound Only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Daily Limit</Label>
                  <Input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                    min="1"
                    max="150"
                    placeholder="100"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Phone Number
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

