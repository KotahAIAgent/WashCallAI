'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTwilioPhoneCheckout } from '@/lib/phone-numbers/twilio-purchase-actions'
import { useToast } from '@/hooks/use-toast'
import { Phone, Loader2, Search, DollarSign, MapPin } from 'lucide-react'

interface PhoneNumberCatalogProps {
  organizationId: string
}

interface PhoneNumber {
  phoneNumber: string
  friendlyName: string
  region?: string
  locality?: string
  postalCode?: string
  areaCode?: string
  capabilities: {
    voice: boolean
    SMS: boolean
    MMS: boolean
  }
  priceCents: number
}

export function PhoneNumberCatalog({ organizationId }: PhoneNumberCatalogProps) {
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [filters, setFilters] = useState({
    areaCode: '',
    state: '',
    city: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    loadPhoneNumbers()
  }, [filters])

  async function loadPhoneNumbers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.areaCode) params.append('areaCode', filters.areaCode)
      if (filters.state) params.append('region', filters.state)
      if (filters.city) params.append('locality', filters.city)
      params.append('limit', '20')

      const response = await fetch(`/api/phone-numbers/search?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search phone numbers')
      }

      setPhoneNumbers(data.numbers || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load phone numbers',
        variant: 'destructive',
      })
      setPhoneNumbers([])
    }
    setLoading(false)
  }

  async function handlePurchase(phone: PhoneNumber) {
    setPurchasing(phone.phoneNumber)
    const result = await createTwilioPhoneCheckout({
      phoneNumber: phone.phoneNumber,
      organizationId,
      priceCents: phone.priceCents,
      areaCode: phone.areaCode,
      locality: phone.locality,
      region: phone.region,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setPurchasing(null)
    } else if (result.url) {
      // Redirect to Stripe checkout
      window.location.href = result.url
    }
  }

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`
  }

  function getLocationDisplay(phone: PhoneNumber): string {
    const parts: string[] = []
    if (phone.locality) parts.push(phone.locality)
    if (phone.region) parts.push(phone.region)
    return parts.length > 0 ? parts.join(', ') : 'United States'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Purchase Phone Numbers
        </CardTitle>
        <CardDescription>
          Browse and purchase phone numbers for your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="areaCode">Area Code</Label>
            <Input
              id="areaCode"
              placeholder="e.g., 415"
              value={filters.areaCode}
              onChange={(e) => setFilters(prev => ({ ...prev, areaCode: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="e.g., CA"
              value={filters.state}
              onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g., San Francisco"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            />
          </div>
        </div>

        {/* Phone Numbers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : phoneNumbers.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No phone numbers available matching your filters.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilters({ areaCode: '', state: '', city: '' })}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {phoneNumbers.map((phone) => (
              <div
                key={phone.phoneNumber}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-lg">{phone.phoneNumber}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {phone.areaCode && (
                          <span className="flex items-center gap-1">
                            <span>Area: {phone.areaCode}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {getLocationDisplay(phone)}
                        </span>
                        <span className="flex items-center gap-1">
                          {phone.capabilities.voice && <span className="text-xs">Voice</span>}
                          {phone.capabilities.SMS && <span className="text-xs">SMS</span>}
                          {phone.capabilities.MMS && <span className="text-xs">MMS</span>}
                        </span>
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <DollarSign className="h-4 w-4" />
                          {formatPrice(phone.priceCents)}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handlePurchase(phone)}
                  disabled={purchasing === phone.phoneNumber}
                >
                  {purchasing === phone.phoneNumber ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Purchase'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

