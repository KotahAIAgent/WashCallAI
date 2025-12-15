import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { CampaignTypeSelector } from '@/components/campaigns/CampaignTypeSelector'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Build Campaign | FusionCaller',
  description: 'Build a campaign from CRM data or lists',
}

export default async function BuildCampaignPage() {
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
    redirect('/app/dashboard')
  }

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
        <h2 className="text-2xl font-bold tracking-tight">Build Campaign</h2>
        <p className="text-muted-foreground">
          Create a campaign from your CRM data, past customers, invoices, estimates, or form leads
        </p>
      </div>

      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Builder</CardTitle>
            <CardDescription>
              Select a campaign type and configure it to automatically build your campaign with contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BuildCampaignForm organizationId={profile.organization_id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BuildCampaignForm({ organizationId }: { organizationId: string }) {
  return <CampaignTypeSelector organizationId={organizationId} />
}

