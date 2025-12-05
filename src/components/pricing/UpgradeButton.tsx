'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface UpgradeButtonProps {
  planKey: string
  planName: string
  isUpgrade: boolean
}

export function UpgradeButton({ planKey, planName, isUpgrade }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleClick() {
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading}
      className="w-full"
      variant={isUpgrade ? 'default' : 'outline'}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : isUpgrade ? (
        `Upgrade to ${planName}`
      ) : (
        `Get ${planName}`
      )}
    </Button>
  )
}

