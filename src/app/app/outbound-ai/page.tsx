import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  PhoneOutgoing, 
  Info, 
  Calendar, 
  Clock, 
  Shield, 
  TrendingUp,
  FolderOpen,
  Users,
  PlayCircle,
  Plus,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { OutboundCampaignSelector } from '@/components/agents/OutboundCampaignSelector'

async function getAgentConfig(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('organization_id', organizationId)
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

async function getCampaigns(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('campaigns')
    .select('*, phone_numbers(phone_number, friendly_name)')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })

  return data || []
}

export default async function OutboundAIPage() {
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

  const [config, phoneNumbers, campaigns] = await Promise.all([
    getAgentConfig(profile.organization_id),
    getPhoneNumbers(profile.organization_id),
    getCampaigns(profile.organization_id),
  ])

  // Campaign stats
  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const totalContacts = campaigns.reduce((acc, c) => acc + (c.total_contacts || 0), 0)
  const totalInterested = campaigns.reduce((acc, c) => acc + (c.contacts_interested || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PhoneOutgoing className="h-6 w-6" />
          Outbound AI Agent
        </h2>
        <p className="text-muted-foreground">
          Manage campaigns and let your AI automatically call contacts
        </p>
      </div>

      {/* Agent Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {config?.outbound_agent_id ? (
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold">
                  {config?.outbound_agent_id ? 'Outbound Agent Ready' : 'Agent Setup Pending'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config?.outbound_agent_id 
                    ? 'Your AI agent is configured and ready to make calls'
                    : 'Contact NeverMiss AI support to set up your outbound agent'}
                </p>
              </div>
            </div>
            <Badge variant={config?.outbound_agent_id ? 'default' : 'secondary'}>
              {config?.outbound_agent_id ? 'Active' : 'Pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns.length}</div>
            <p className="text-xs text-muted-foreground">{campaigns.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interested</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalInterested}</div>
            <p className="text-xs text-muted-foreground">
              {totalContacts > 0 ? ((totalInterested / totalContacts) * 100).toFixed(1) : 0}% conversion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phone Numbers</CardTitle>
            <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phoneNumbers.length}</div>
            <p className="text-xs text-muted-foreground">Available for calling</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Select Campaign to Call
                </CardTitle>
                <CardDescription>
                  Choose an active campaign to start calling contacts
                </CardDescription>
              </div>
              <Link href="/app/campaigns/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <OutboundCampaignSelector 
              campaigns={campaigns}
              phoneNumbers={phoneNumbers}
              agentConfigured={!!config?.outbound_agent_id}
            />
          </CardContent>
        </Card>

        {/* How It Works */}
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
                <FolderOpen className="h-4 w-4 text-blue-500" />
                1. Create Campaigns
              </h4>
              <p className="text-sm text-muted-foreground">
                Organize your contacts into campaigns. Import from CSV or add manually.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />
                2. Set Schedule
              </h4>
              <p className="text-sm text-muted-foreground">
                Configure calling days and hours. Avoid rush hours for better answer rates.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-purple-500" />
                3. Start Calling
              </h4>
              <p className="text-sm text-muted-foreground">
                Activate the campaign and your AI will automatically call contacts.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-500" />
                4. Built-in Protection
              </h4>
              <p className="text-sm text-muted-foreground">
                We limit calls to 100/day per number and 2/day per contact to avoid spam flags.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      {campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Campaigns</CardTitle>
              <Link href="/app/campaigns">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((campaign) => {
                const progressPercent = campaign.total_contacts > 0 
                  ? (campaign.contacts_called / campaign.total_contacts) * 100 
                  : 0

                return (
                  <Link key={campaign.id} href={`/app/campaigns/${campaign.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.contacts_called}/{campaign.total_contacts} called • {campaign.contacts_interested} interested
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        campaign.status === 'active' ? 'default' :
                        campaign.status === 'completed' ? 'secondary' :
                        'outline'
                      }>
                        {campaign.status}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
