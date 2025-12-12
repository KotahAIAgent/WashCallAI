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
  const [dailyLimit, setDailyLimit] = useState('20')
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

    // Validate UUID format for provider_phone_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(providerPhoneId.trim())) {
      toast({
        title: 'Invalid Phone Number ID',
        description: 'Vapi Phone Number ID must be a UUID (e.g., 123e4567-e89b-12d3-a456-426614174000). Get it from Vapi Dashboard → Phone Numbers → Click on your number → Copy the ID.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const result = await adminAddPhoneNumber(
      selectedOrg,
      phoneNumber,
      providerPhoneId.trim(),
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
                <li>Navigate to <strong>Phone Numbers</strong> (left sidebar)</li>
                <li>Click on your phone number</li>
                <li>Copy the <strong>ID</strong> field (it's a UUID like: <code className="bg-muted px-1 rounded">123e4567-e89b-12d3-a456-426614174000</code>)</li>
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
              <Select 
                value={phoneType} 
                onValueChange={(v) => {
                  const newType = v as 'inbound' | 'outbound' | 'both'
                  setPhoneType(newType)
                  // Auto-update daily limit based on type
                  if (newType === 'inbound') {
                    setDailyLimit('100')
                  } else {
                    setDailyLimit('20')
                  }
                }}
              >
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
                max={phoneType === 'inbound' ? '150' : '20'}
                onFocus={() => {
                  // Auto-set to appropriate default if empty or still at old default
                  if (!dailyLimit || dailyLimit === '100') {
                    setDailyLimit(phoneType === 'inbound' ? '100' : '20')
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {phoneType === 'inbound' 
                  ? 'Maximum calls per day for inbound numbers (max 150)'
                  : 'Maximum calls per day for outbound numbers (max 20)'}
              </p>
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

