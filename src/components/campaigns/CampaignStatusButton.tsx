'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateCampaignStatus } from '@/lib/campaigns/actions'
import { useToast } from '@/hooks/use-toast'
import { PlayCircle, Pause, CheckCircle2, Loader2 } from 'lucide-react'

export function CampaignStatusButton({
  campaignId,
  currentStatus,
  hasContacts,
}: {
  campaignId: string
  currentStatus: string
  hasContacts: boolean
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleStatusChange(newStatus: 'active' | 'paused' | 'completed') {
    setLoading(true)
    const result = await updateCampaignStatus(campaignId, newStatus)
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ 
        title: 'Status updated', 
        description: `Campaign is now ${newStatus}` 
      })
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <Button disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Updating...
      </Button>
    )
  }

  if (currentStatus === 'completed') {
    return (
      <Button variant="outline" disabled>
        <CheckCircle2 className="h-4 w-4 mr-2" />
        Completed
      </Button>
    )
  }

  if (currentStatus === 'active') {
    return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => handleStatusChange('paused')}>
          <Pause className="h-4 w-4 mr-2" />
          Pause
        </Button>
        <Button variant="outline" onClick={() => handleStatusChange('completed')}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Complete
        </Button>
      </div>
    )
  }

  // Draft or Paused
  return (
    <Button 
      onClick={() => handleStatusChange('active')}
      disabled={!hasContacts}
      title={!hasContacts ? 'Add contacts to start the campaign' : ''}
    >
      <PlayCircle className="h-4 w-4 mr-2" />
      {currentStatus === 'paused' ? 'Resume' : 'Start Campaign'}
    </Button>
  )
}

