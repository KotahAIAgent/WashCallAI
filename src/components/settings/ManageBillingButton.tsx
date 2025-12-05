'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to open billing portal',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      type="button" 
      variant="outline" 
      onClick={handleManageBilling}
      disabled={loading}
    >
      {loading ? 'Loading...' : 'Manage Billing'}
    </Button>
  )
}

