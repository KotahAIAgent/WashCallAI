'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminAddPhoneNumber } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'
import { Phone, Loader2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
}

export function AdminAddPhoneNumber({ organizations }: { organizations: Organization[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [providerPhoneId, setProviderPhoneId] = useState('')
  const [friendlyName, setFriendlyName] = useState('')
  const [phoneType, setPhoneType] = useState<'inbound' | 'outbound' | 'both'>('both')
  const [dailyLimit, setDailyLimit] = useState('100')
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedOrg || !phoneNumber || !providerPhoneId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const result = await adminAddPhoneNumber(
      selectedOrg,
      phoneNumber,
      providerPhoneId,
      friendlyName,
      phoneType,
      parseInt(dailyLimit)
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
        description: 'Phone number added successfully',
      })
      setPhoneNumber('')
      setProviderPhoneId('')
      setFriendlyName('')
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Add Phone Number
        </CardTitle>
        <CardDescription>
          Assign a Vapi/Twilio phone number to an organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
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

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+14155551234"
            />
            <p className="text-xs text-muted-foreground">
              The actual phone number in E.164 format
            </p>
          </div>

          <div className="space-y-2">
            <Label>Vapi Phone Number ID</Label>
            <Input
              value={providerPhoneId}
              onChange={(e) => setProviderPhoneId(e.target.value)}
              placeholder="phone_xxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Get this from Vapi dashboard → Phone Numbers → Copy ID
            </p>
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
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Phone Number'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

