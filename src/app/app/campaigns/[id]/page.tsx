import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  FolderOpen, 
  Phone, 
  Users, 
  CheckCircle2, 
  PlayCircle,
  Pause,
  Settings,
  Upload,
  Plus,
  MoreHorizontal
} from 'lucide-react'
import { CampaignContacts } from '@/components/campaigns/CampaignContacts'
import { CampaignStatusButton } from '@/components/campaigns/CampaignStatusButton'
import { AddContactDialog } from '@/components/campaigns/AddContactDialog'
import { ImportContactsDialog } from '@/components/campaigns/ImportContactsDialog'
import { ExportButton } from '@/components/export/ExportButton'
import { DeleteCampaignButton } from '@/components/campaigns/DeleteCampaignButton'

async function getCampaign(campaignId: string, organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('campaigns')
    .select('*, phone_numbers(phone_number, friendly_name)')
    .eq('id', campaignId)
    .eq('organization_id', organizationId)
    .single()

  return data
}

async function getContacts(campaignId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('campaign_contacts')
    .select('*, phone_numbers(phone_number, friendly_name)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  return data || []
}

async function getPhoneNumbers(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .or('type.eq.outbound,type.eq.both')
    .order('created_at', { ascending: true })

  return data || []
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: MoreHorizontal },
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: PlayCircle },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', icon: Pause },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const { id } = await params
  const campaign = await getCampaign(id, profile.organization_id)
  
  if (!campaign) {
    notFound()
  }

  const [contacts, phoneNumbers] = await Promise.all([
    getContacts(id),
    getPhoneNumbers(profile.organization_id)
  ])
  const status = statusConfig[campaign.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  // Calculate stats
  const pendingCount = contacts.filter(c => c.status === 'pending').length
  const calledCount = contacts.filter(c => !['pending', 'queued'].includes(c.status)).length
  const interestedCount = contacts.filter(c => c.status === 'interested').length
  const schedule = campaign.schedule as { enabledDays?: string[]; startTime?: string; endTime?: string; timezone?: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/campaigns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <FolderOpen className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">{campaign.name}</h2>
              <Badge className={status.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-muted-foreground mt-1">{campaign.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CampaignStatusButton 
            campaignId={campaign.id} 
            currentStatus={campaign.status}
            hasContacts={contacts.length > 0}
          />
          <Link href={`/app/campaigns/${campaign.id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <DeleteCampaignButton campaignId={campaign.id} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">{pendingCount} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Called</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calledCount}</div>
            <p className="text-xs text-muted-foreground">
              {contacts.length > 0 ? ((calledCount / contacts.length) * 100).toFixed(0) : 0}% complete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interested</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{interestedCount}</div>
            <p className="text-xs text-muted-foreground">
              {calledCount > 0 ? ((interestedCount / calledCount) * 100).toFixed(0) : 0}% conversion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {schedule?.startTime || '09:00'} - {schedule?.endTime || '17:00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {schedule?.enabledDays?.length || 5} days/week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>
                Manage the contacts in this campaign
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <ExportButton 
                organizationId={profile.organization_id} 
                type="campaigns"
                campaignId={campaign.id}
              />
              <ImportContactsDialog 
                campaignId={campaign.id}
                organizationId={profile.organization_id}
              />
              <AddContactDialog 
                campaignId={campaign.id}
                organizationId={profile.organization_id}
                phoneNumbers={phoneNumbers}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CampaignContacts 
            contacts={contacts}
            campaignId={campaign.id}
            phoneNumbers={phoneNumbers}
          />
        </CardContent>
      </Card>
    </div>
  )
}

