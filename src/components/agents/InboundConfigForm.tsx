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
import { updateInboundConfig, setAgentId } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/types/database'
import { Phone, CheckCircle2, AlertTriangle, ExternalLink, Bot } from 'lucide-react'
import { useState } from 'react'

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
  const [agentIdLoading, setAgentIdLoading] = useState(false)
  const [agentId, setAgentId] = useState('')
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

          {/* Self-Service Assistant ID Setup */}
          {!config?.inbound_agent_id && (
            <div className="space-y-3 p-4 rounded-lg border border-dashed border-primary/50 bg-primary/5">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Add Your Assistant ID</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect your AI assistant to start receiving calls. Contact support if you need help finding your Assistant ID.
              </p>
              <div className="flex gap-2">
                <Input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter your Assistant ID"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={async () => {
                    if (!agentId.trim()) {
                      toast({
                        title: 'Error',
                        description: 'Please enter your Assistant ID',
                        variant: 'destructive',
                      })
                      return
                    }
                    setAgentIdLoading(true)
                    const result = await setAgentId('inbound', agentId.trim())
                    if (result?.error) {
                      toast({
                        title: 'Error',
                        description: result.error,
                        variant: 'destructive',
                      })
                    } else {
                      toast({
                        title: 'Success',
                        description: 'Assistant ID saved! Your agent is now configured.',
                      })
                      setAgentId('')
                      window.location.reload() // Refresh to show updated status
                    }
                    setAgentIdLoading(false)
                  }}
                  disabled={agentIdLoading}
                >
                  {agentIdLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Need help? Contact support to get your Assistant ID or create a new assistant.
              </p>
            </div>
          )}

          {config?.inbound_agent_id && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Assistant ID Configured</span>
                </div>
                <code className="text-xs bg-white px-2 py-1 rounded border text-green-800">
                  {config.inbound_agent_id}
                </code>
              </div>
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

