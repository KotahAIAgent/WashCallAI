import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  FolderOpen, 
  Plus, 
  Phone, 
  Users, 
  CheckCircle2, 
  Pause,
  PlayCircle,
  MoreHorizontal 
} from 'lucide-react'
import { format } from 'date-fns'

async function getCampaigns(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('campaigns')
    .select('*, phone_numbers(phone_number, friendly_name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  return data || []
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: MoreHorizontal },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: PlayCircle },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', icon: Pause },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
}

export default async function CampaignsPage() {
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

  const campaigns = await getCampaigns(profile.organization_id)

  // Calculate totals
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalContacts = campaigns.reduce((acc, c) => acc + (c.total_contacts || 0), 0)
  const totalInterested = campaigns.reduce((acc, c) => acc + (c.contacts_interested || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6" />
            Outbound Campaigns
          </h2>
          <p className="text-sm text-muted-foreground">
            Organize your outbound calling contacts into campaigns
          </p>
        </div>
        <Link href="/app/campaigns/new" className="flex-shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground">{activeCampaigns} active</p>
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
            <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((acc, c) => acc + (c.contacts_called || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total outbound calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="grid gap-3 sm:gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first campaign to start organizing outbound calls
              </p>
              <Link href="/app/campaigns/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => {
            const status = statusConfig[campaign.status as keyof typeof statusConfig]
            const StatusIcon = status.icon
            const progressPercent = campaign.total_contacts > 0 
              ? (campaign.contacts_called / campaign.total_contacts) * 100 
              : 0

            return (
              <Link key={campaign.id} href={`/app/campaigns/${campaign.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                          <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base sm:text-lg">{campaign.name}</h3>
                            <Badge className={`${status.color} sm:hidden`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {campaign.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                              {campaign.total_contacts} contacts
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                              {campaign.contacts_called} called
                            </span>
                            {campaign.contacts_interested > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                {campaign.contacts_interested} interested
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(campaign.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    {campaign.total_contacts > 0 && (
                      <div className="mt-3 sm:mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{campaign.contacts_called} / {campaign.total_contacts} ({progressPercent.toFixed(0)}%)</span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

