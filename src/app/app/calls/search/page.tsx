import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TranscriptSearch } from '@/components/calls/TranscriptSearch'

export const metadata: Metadata = {
  title: 'Search Transcripts | FusionCaller',
  description: 'Search across all call transcripts',
}

export default async function TranscriptSearchPage() {
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
      <div>
        <h1 className="text-3xl font-bold">Search Transcripts</h1>
        <p className="text-muted-foreground mt-2">
          Search across all your call transcripts to find specific conversations
        </p>
      </div>

      <TranscriptSearch organizationId={profile.organization_id} />
    </div>
  )
}

