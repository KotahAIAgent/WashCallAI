import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IntegrationCard } from '@/components/integrations/IntegrationCard'
import { RequestIntegrationDialog } from '@/components/integrations/RequestIntegrationDialog'
import { 
  Plug, 
  Webhook, 
  Calendar, 
  Users, 
  Mail,
  MessageSquare,
  FileSpreadsheet,
  Smartphone,
  Lightbulb,
  Vote
} from 'lucide-react'

const integrations = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect WashCall AI to 5,000+ apps. Automate workflows when leads come in or appointments are booked.',
    icon: Webhook,
    category: 'Automation',
    status: 'available' as const,
    popular: true,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Automatically sync booked appointments to your Google Calendar. Never miss an estimate.',
    icon: Calendar,
    category: 'Calendar',
    status: 'coming_soon' as const,
    popular: true,
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    description: 'Push leads directly into HubSpot. Track the full customer journey from call to close.',
    icon: Users,
    category: 'CRM',
    status: 'coming_soon' as const,
    popular: false,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise-grade CRM integration. Sync leads, calls, and appointments automatically.',
    icon: Users,
    category: 'CRM',
    status: 'coming_soon' as const,
    popular: false,
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    description: 'Export leads and call data to Google Sheets automatically. Build custom reports.',
    icon: FileSpreadsheet,
    category: 'Productivity',
    status: 'coming_soon' as const,
    popular: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get instant notifications in Slack when you receive new leads or booked appointments.',
    icon: MessageSquare,
    category: 'Communication',
    status: 'coming_soon' as const,
    popular: false,
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Add leads to your email lists automatically. Nurture leads with email campaigns.',
    icon: Mail,
    category: 'Marketing',
    status: 'coming_soon' as const,
    popular: false,
  },
  {
    id: 'jobber',
    name: 'Jobber',
    description: 'Service business software integration. Create jobs and customers from leads.',
    icon: Smartphone,
    category: 'Field Service',
    status: 'coming_soon' as const,
    popular: false,
  },
]

export default async function IntegrationsPage() {
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

  // Get organization's plan for feature gating
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', profile.organization_id)
    .single()

  const plan = org?.plan || 'starter'
  const availableIntegrations = integrations.filter(i => i.status === 'available')
  const comingSoonIntegrations = integrations.filter(i => i.status === 'coming_soon')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="h-6 w-6" />
          Integrations
        </h2>
        <p className="text-muted-foreground">
          Connect WashCall AI with your favorite tools and automate your workflow
        </p>
      </div>

      {/* Zapier Highlight */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
        <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-orange-500 text-white">
              <Webhook className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Zapier Integration</h3>
                <Badge className="bg-green-100 text-green-700">Available Now</Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Connect WashCall AI to 5,000+ apps. Create automated workflows when:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• A new lead is captured</li>
                <li>• An appointment is booked</li>
                <li>• A call is completed</li>
                <li>• A lead status changes</li>
              </ul>
            </div>
          </div>
          <IntegrationCard
            integration={integrations.find(i => i.id === 'zapier')!}
            organizationId={profile.organization_id}
            isConnected={false}
            isPro={plan === 'pro' || plan === 'growth'}
          />
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Coming Soon</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comingSoonIntegrations.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/90 dark:from-gray-900/80 dark:to-gray-900/90 z-10" />
                <CardHeader className="relative z-0">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {integration.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-0">
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                </CardContent>
                <div className="absolute top-4 right-4 z-20">
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Request Integration */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            Request an Integration
          </CardTitle>
          <CardDescription>
            Don't see the tool you need? Let us know and we'll prioritize building it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Popular Requests</h4>
              <div className="space-y-2">
                {[
                  { name: 'QuickBooks', votes: 24, category: 'Accounting' },
                  { name: 'ServiceTitan', votes: 18, category: 'Field Service' },
                  { name: 'Housecall Pro', votes: 15, category: 'Field Service' },
                  { name: 'Microsoft Teams', votes: 12, category: 'Communication' },
                ].map((item) => (
                  <div 
                    key={item.name} 
                    className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Vote className="h-3 w-3" />
                      {item.votes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-sm">Why request?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your vote helps us prioritize</li>
                  <li>• Get notified when it's ready</li>
                  <li>• Shape the product roadmap</li>
                </ul>
              </div>
              <RequestIntegrationDialog organizationId={profile.organization_id} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

