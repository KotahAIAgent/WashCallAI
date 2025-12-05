import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneIncoming, Info, MessageSquare, Calendar, Users, Clock } from 'lucide-react'
import { InboundConfigForm } from '@/components/agents/InboundConfigForm'

async function getAgentConfig(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  return data
}

async function getOrganization(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  return data
}

async function getPhoneNumbers(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .order('created_at', { ascending: true })

  return data || []
}

export default async function InboundAIPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No organization found</div>
  }

  const [config, organization, phoneNumbers] = await Promise.all([
    getAgentConfig(profile.organization_id),
    getOrganization(profile.organization_id),
    getPhoneNumbers(profile.organization_id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PhoneIncoming className="h-6 w-6" />
          Inbound AI Receptionist
        </h2>
        <p className="text-muted-foreground">
          Your 24/7 AI receptionist answers calls and captures leads while you work
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InboundConfigForm 
          organizationId={profile.organization_id}
          config={config}
          organization={organization}
          phoneNumbers={phoneNumbers}
        />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  24/7 Availability
                </h4>
                <p className="text-sm text-muted-foreground">
                  Never miss a call again. Your AI receptionist answers every call instantly,
                  day or night, weekends and holidays included.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  Natural Conversations
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your AI sounds natural and professional. It greets callers by your business name,
                  asks the right questions, and handles objections smoothly.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  Lead Qualification
                </h4>
                <p className="text-sm text-muted-foreground">
                  Automatically captures name, phone, address, and service needs. Identifies 
                  residential vs commercial jobs and checks if they're in your service area.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Appointment Booking
                </h4>
                <p className="text-sm text-muted-foreground">
                  When enabled, your AI can schedule estimate appointments directly on your calendar.
                  No more phone tag or missed opportunities.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Callers Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-l-blue-500">
                <p className="text-sm italic text-muted-foreground">
                  "Thank you for calling {organization?.name || 'your business'}! This is your AI assistant. 
                  How can I help you today?"
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your AI will then:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Ask about the service they need</li>
                <li>Collect their contact information</li>
                <li>Get their property address</li>
                <li>Qualify residential vs commercial</li>
                <li>Check if they're in your service area</li>
                <li>Book an estimate or take a message</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              {config?.inbound_enabled ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">Active & Answering Calls</span>
                </div>
              ) : config?.inbound_agent_id ? (
                <div className="flex items-center gap-2 text-amber-600">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-medium">Configured - Enable to start</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="font-medium">Pending Setup</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
