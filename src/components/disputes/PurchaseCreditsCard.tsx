'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Loader2, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const PRICE_PER_MINUTE = 0.30
const BULK_OPTIONS = [
  { minutes: 100, label: '100 minutes', price: 30 },
  { minutes: 250, label: '250 minutes', price: 75 },
  { minutes: 500, label: '500 minutes', price: 150 },
  { minutes: 1000, label: '1,000 minutes', price: 300 },
  { minutes: 2500, label: '2,500 minutes', price: 750 },
  { minutes: 5000, label: '5,000 minutes', price: 1500 },
]

export function PurchaseCreditsCard() {
  const [customMinutes, setCustomMinutes] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePurchase = async (minutes: number) => {
    if (minutes < 1) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter at least 1 minute.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/stripe/checkout-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      console.error('Error purchasing credits:', error)
      toast({
        title: 'Purchase failed',
        description: error.message || 'An error occurred while processing your purchase.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  const customPrice = customMinutes ? (parseInt(customMinutes) || 0) * PRICE_PER_MINUTE : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Purchase Call Credits
        </CardTitle>
        <CardDescription>
          Buy minutes that never expire. Credits are used automatically after your monthly plan minutes are exhausted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info box */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How Credits Work:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Credits cost $0.30 per minute</li>
              <li>Credits never expire</li>
              <li>Used automatically after monthly minutes are exhausted</li>
              <li>Monthly minutes reset each month, credits persist</li>
            </ul>
          </div>
        </div>

        {/* Bulk options */}
        <div className="space-y-2">
          <Label>Quick Purchase Options</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {BULK_OPTIONS.map((option) => (
              <Button
                key={option.minutes}
                variant="outline"
                onClick={() => handlePurchase(option.minutes)}
                disabled={loading}
                className="flex flex-col items-start h-auto py-3"
              >
                <span className="font-semibold">{option.label}</span>
                <span className="text-xs text-muted-foreground">${option.price.toLocaleString()}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div className="space-y-2">
          <Label htmlFor="customMinutes">Custom Amount</Label>
          <div className="flex gap-2">
            <Input
              id="customMinutes"
              type="number"
              min="1"
              placeholder="Enter minutes"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={() => handlePurchase(parseInt(customMinutes) || 0)}
              disabled={loading || !customMinutes || parseInt(customMinutes) < 1}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Buy ${customPrice.toFixed(2)}
                </>
              )}
            </Button>
          </div>
          {customPrice > 0 && (
            <p className="text-xs text-muted-foreground">
              {parseInt(customMinutes) || 0} minutes × $0.30 = ${customPrice.toFixed(2)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

