import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkflowsPageClient } from './WorkflowsPageClient'
import { getWorkflows } from '@/lib/workflows/actions'

export default async function WorkflowsPage() {
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

  const result = await getWorkflows(profile.organization_id)
  const workflows = result.workflows || []

  return <WorkflowsPageClient initialWorkflows={workflows} organizationId={profile.organization_id} />
}

