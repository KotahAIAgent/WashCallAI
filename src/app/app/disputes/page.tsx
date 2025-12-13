import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMyDisputes, getUsageStats } from '@/lib/disputes/actions'
import { BILLABLE_STATUSES } from '@/lib/disputes/constants'
import { UsageStatsCard } from '@/components/disputes/UsageStatsCard'
import { DisputesList } from '@/components/disputes/DisputesList'
import { CallHistoryWithDispute } from '@/components/disputes/CallHistoryWithDispute'
import { PurchaseCreditsCard } from '@/components/disputes/PurchaseCreditsCard'
import { AlertCircle, Info } from 'lucide-react'

export default async function DisputesPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    redirect('/login')
  }

  const organizationId = profile.organization_id

  // Fetch data
  const [disputesResult, usageResult] = await Promise.all([
    getMyDisputes(organizationId),
    getUsageStats(organizationId),
  ])

  // Get recent outbound calls for dispute submission
  const { data: recentCalls } = await supabase
    .from('calls')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('direction', 'outbound')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get recent campaign contacts with calls
  const { data: campaignContacts } = await supabase
    .from('campaign_contacts')
    .select('*, campaigns:campaign_id (name)')
    .eq('organization_id', organizationId)
    .not('last_call_at', 'is', null)
    .order('last_call_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Call Usage & Disputes</h1>
        <p className="text-muted-foreground">
          Monitor your outbound call usage and request reviews for incorrectly charged calls.
        </p>
      </div>

      {/* Usage Stats */}
      {usageResult && !usageResult.error && (
        <UsageStatsCard stats={usageResult as any} />
      )}

      {/* Purchase Credits */}
      <PurchaseCreditsCard />

      {/* How Billing Works Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            How Call Billing Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>We only charge for actual conversations.</strong> The following call outcomes count toward your monthly limit:
          </p>
          <div className="flex flex-wrap gap-2 my-2">
            {BILLABLE_STATUSES.map((status) => (
              <span key={status} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {status}
              </span>
            ))}
          </div>
          <p>
            <strong>These do NOT count:</strong> Voicemails, no answers, wrong numbers, and failed calls.
          </p>
          <p>
            If you believe a call was incorrectly charged, you can request a review below. We'll listen to the recording and adjust your usage if warranted.
          </p>
        </CardContent>
      </Card>

      {/* Pending Disputes Warning */}
      {disputesResult?.disputes && disputesResult.disputes.filter(d => d.status === 'pending').length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm">
                You have <strong>{disputesResult.disputes.filter(d => d.status === 'pending').length}</strong> dispute(s) pending review. 
                We typically review disputes within 24-48 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Disputes */}
      <Card>
        <CardHeader>
          <CardTitle>Your Disputes</CardTitle>
          <CardDescription>
            View the status of your submitted dispute requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisputesList disputes={disputesResult?.disputes || []} />
        </CardContent>
      </Card>

      {/* Call History - Submit Disputes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Outbound Calls</CardTitle>
          <CardDescription>
            Review your recent outbound calls. Click "Request Review" on any call you believe was incorrectly charged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CallHistoryWithDispute
            calls={recentCalls || []}
            campaignContacts={campaignContacts || []}
            organizationId={organizationId}
            existingDisputes={disputesResult?.disputes || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}

