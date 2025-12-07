import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CampaignSettingsForm } from '@/components/campaigns/CampaignSettingsForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings } from 'lucide-react'

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

export default async function CampaignSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
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
  const [campaign, phoneNumbers] = await Promise.all([
    getCampaign(id, profile.organization_id),
    getPhoneNumbers(profile.organization_id),
  ])

  if (!campaign) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/campaigns/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaign
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Campaign Settings</h2>
            </div>
            <p className="text-muted-foreground mt-1">
              Update campaign configuration and calling preferences
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Campaign</CardTitle>
          <CardDescription>
            Modify campaign details, schedule, and calling preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignSettingsForm 
            campaign={campaign}
            phoneNumbers={phoneNumbers}
            organizationId={profile.organization_id}
          />
        </CardContent>
      </Card>
    </div>
  )
}

