'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateInboundConfig } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'
import { Phone, CheckCircle2, AlertTriangle } from 'lucide-react'
import { VoiceSelector } from '@/components/agents/VoiceSelector'
import { PromptChangeRequest } from '@/components/agents/PromptChangeRequest'

type AgentConfig = Database['public']['Tables']['agent_configs']['Row']
type Organization = Database['public']['Tables']['organizations']['Row']
type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row']

export function InboundConfigForm({
  organizationId,
  config,
  organization,
  phoneNumbers,
}: {
  organizationId: string
  config: AgentConfig | null
  organization: Organization | null
  phoneNumbers: PhoneNumber[]
}) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Filter phone numbers that can be used for inbound
  const inboundPhones = phoneNumbers.filter(p => p.type === 'inbound' || p.type === 'both')
  const currentInboundPhone = phoneNumbers.find(p => p.id === config?.inbound_phone_number_id)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append('organizationId', organizationId)
    
    const result = await updateInboundConfig(formData)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Inbound Agent configuration saved successfully',
      })
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbound Agent Configuration</CardTitle>
        <CardDescription>Configure your AI receptionist for incoming calls</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">

          {/* Agent Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {config?.inbound_enabled ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium">Agent Status</p>
                <p className="text-sm text-muted-foreground">
                  {config?.inbound_enabled 
                    ? 'Your inbound agent is active and answering calls'
                    : config?.inbound_agent_id 
                    ? 'Configured - Enable to start'
                    : 'Add your Vapi Assistant ID below to get started'}
                </p>
              </div>
            </div>
            <Badge variant={config?.inbound_enabled ? 'default' : config?.inbound_agent_id ? 'secondary' : 'outline'}>
              {config?.inbound_enabled ? 'Active' : config?.inbound_agent_id ? 'Configured' : 'Setup Required'}
            </Badge>
          </div>

          {!config?.inbound_agent_id && (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">
                  Your inbound agent is being set up by our team. You'll be notified when it's ready.
                </p>
              </div>
            </div>
          )}

          {config?.inbound_agent_id && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Agent Configured</span>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Active
                </Badge>
              </div>
            </div>
          )}

          {/* Voice Selection and Prompt Change Request */}
          {config?.inbound_agent_id && (
            <div className="space-y-4">
              <VoiceSelector
                organizationId={organizationId}
                agentType="inbound"
                currentVoiceId={config.voice_id}
                currentVoiceName={config.voice_name}
              />
              
              <PromptChangeRequest
                organizationId={organizationId}
                agentType="inbound"
              />
            </div>
          )}

          {/* Inbound Phone Number Display */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <Label className="text-base font-semibold">Your Business Line</Label>
            </div>
            
            {currentInboundPhone ? (
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{currentInboundPhone.phone_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentInboundPhone.friendly_name || 'Main Business Line'}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Forward your business calls to this number or use it as your main line
                </p>
              </div>
            ) : inboundPhones.length > 0 ? (
              <div className="space-y-2">
                <Select name="inboundPhoneNumberId" defaultValue={inboundPhones[0]?.id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select inbound number" />
                  </SelectTrigger>
                  <SelectContent>
                    {inboundPhones.map((phone) => (
                      <SelectItem key={phone.id} value={phone.id}>
                        {phone.friendly_name || phone.phone_number} ({phone.phone_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-dashed text-center">
                <Phone className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No phone number assigned yet.
                </p>
                <a 
                  href="/app/settings?tab=phone" 
                  className="text-sm text-primary hover:underline"
                >
                  Add a phone number in Settings →
                </a>
              </div>
            )}
          </div>

          {/* Business Info */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              name="businessName"
              defaultValue={config?.custom_business_name || organization?.name || ''}
              placeholder="My Business Name"
            />
            <p className="text-sm text-muted-foreground">
              Your AI will introduce itself as representing this business. This overrides the Vapi agent's default business name.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceArea">Service Area</Label>
            <Textarea
              id="serviceArea"
              name="serviceArea"
              defaultValue={config?.custom_service_area || ''}
              placeholder="e.g., Greater Houston area, surrounding suburbs, 25-mile radius"
              rows={2}
            />
            <p className="text-sm text-muted-foreground">
              Help your AI know which areas you serve to qualify leads properly. This overrides the Vapi agent's default service area.
            </p>
          </div>

          {/* Custom Greeting */}
          <div className="space-y-2">
            <Label htmlFor="inboundGreeting">Custom Greeting (Optional)</Label>
            <Textarea
              id="inboundGreeting"
              name="inboundGreeting"
              defaultValue={config?.inbound_greeting || ''}
              placeholder="e.g., Thank you for calling [Business Name], this is your AI assistant. How can I help you today?"
              rows={2}
            />
            <p className="text-sm text-muted-foreground">
              Customize how your AI greets callers, or leave blank for the default
            </p>
          </div>

          {/* Lead Preferences */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold">Lead Preferences</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowResidential">Accept Residential Customers</Label>
                <p className="text-sm text-muted-foreground">
                  Homeowners and residential properties
                </p>
              </div>
              <Switch id="allowResidential" name="allowResidential" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowCommercial">Accept Commercial Customers</Label>
                <p className="text-sm text-muted-foreground">
                  Businesses and commercial properties
                </p>
              </div>
              <Switch id="allowCommercial" name="allowCommercial" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoBookEstimates">Auto-Book Estimates</Label>
                <p className="text-sm text-muted-foreground">
                  Let your AI schedule estimate appointments automatically
                </p>
              </div>
              <Switch id="autoBookEstimates" name="autoBookEstimates" />
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="enableInbound">Enable Inbound Agent</Label>
              <p className="text-sm text-muted-foreground">
                Your AI will answer calls 24/7 when enabled
              </p>
            </div>
            <Switch 
              id="enableInbound" 
              name="enableInbound" 
              defaultChecked={config?.inbound_enabled}
              disabled={!config?.inbound_agent_id}
            />
          </div>
          

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

