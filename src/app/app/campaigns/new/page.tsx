import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewCampaignForm } from '@/components/campaigns/NewCampaignForm'

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

export default async function NewCampaignPage() {
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

  const phoneNumbers = await getPhoneNumbers(profile.organization_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/campaigns">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Campaign</h2>
        <p className="text-muted-foreground">
          Set up a new outbound calling campaign
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>
              Configure your campaign settings. You can add contacts after creating the campaign.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewCampaignForm 
              organizationId={profile.organization_id}
              phoneNumbers={phoneNumbers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

