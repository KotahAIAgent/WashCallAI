'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Database } from '@/types/database'
import { updateCampaignStatus } from '@/lib/campaigns/actions'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { 
  PlayCircle, 
  Pause, 
  FolderOpen,
  Phone,
  Users,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

type Campaign = Database['public']['Tables']['campaigns']['Row'] & {
  phone_numbers?: { phone_number: string; friendly_name: string | null } | null
}
type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

export function OutboundCampaignSelector({
  campaigns,
  phoneNumbers,
  agentConfigured,
}: {
  campaigns: Campaign[]
  phoneNumbers: PhoneNumber[]
  agentConfigured: boolean
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'paused')
  const readyCampaigns = campaigns.filter(c => 
    (c.status === 'draft' || c.status === 'paused') && c.total_contacts > 0
  )
  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)

  async function handleStartCampaign() {
    if (!selectedCampaignId) return
    
    setLoading(true)
    const result = await updateCampaignStatus(selectedCampaignId, 'active')
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Campaign started', description: 'Your AI is now calling contacts' })
    }
    setLoading(false)
  }

  async function handlePauseCampaign(campaignId: string) {
    setLoading(true)
    const result = await updateCampaignStatus(campaignId, 'paused')
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Campaign paused' })
    }
    setLoading(false)
  }

  if (!agentConfigured) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h3 className="font-semibold mb-2">Agent Not Configured</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your outbound AI agent needs to be set up before you can start calling.
          Contact NeverMiss AI support to configure your agent.
        </p>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-8">
        <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">No Campaigns Yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create a campaign and add contacts to start outbound calling
        </p>
        <Link href="/app/campaigns/new">
          <Button>Create Your First Campaign</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Campaigns */}
      {activeCampaigns.filter(c => c.status === 'active').length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Currently Running</Label>
          {activeCampaigns.filter(c => c.status === 'active').map((campaign) => (
            <div 
              key={campaign.id}
              className="p-4 rounded-lg border border-green-200 bg-green-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <PlayCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {campaign.contacts_called}/{campaign.total_contacts}
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {campaign.contacts_interested} interested
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePauseCampaign(campaign.id)}
                    disabled={loading}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                  <Link href={`/app/campaigns/${campaign.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Progress */}
              <div className="mt-3">
                <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ 
                      width: `${campaign.total_contacts > 0 
                        ? (campaign.contacts_called / campaign.total_contacts) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start New Campaign */}
      {readyCampaigns.length > 0 && (
        <div className="space-y-3">
          <Label>Start a Campaign</Label>
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a campaign to start" />
            </SelectTrigger>
            <SelectContent>
              {readyCampaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    <span>{campaign.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {campaign.total_contacts} contacts
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCampaign && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <h4 className="font-medium mb-2">{selectedCampaign.name}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {selectedCampaign.total_contacts} contacts
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {selectedCampaign.phone_numbers?.friendly_name || selectedCampaign.phone_numbers?.phone_number || 'No phone set'}
                </div>
              </div>
              
              <Button 
                onClick={handleStartCampaign} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Campaign
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No ready campaigns */}
      {readyCampaigns.length === 0 && activeCampaigns.filter(c => c.status === 'active').length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">
            {campaigns.some(c => c.total_contacts === 0) 
              ? 'Add contacts to your campaigns to start calling'
              : 'All campaigns are completed or paused'}
          </p>
          <Link href="/app/campaigns">
            <Button variant="link" size="sm">Manage Campaigns</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

