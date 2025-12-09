import { createServerClient } from '@/lib/supabase/server'
import { LeadsPageClient } from './LeadsPageClient'

async function getLeads(organizationId: string, status?: string) {
  const supabase = createServerClient()
  let query = supabase
    .from('leads')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) {
    query = query.eq('status', status)
  }

  const { data } = await query
  return data || []
}

const statusColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  interested: 'default',
  not_interested: 'outline',
  call_back: 'secondary',
  booked: 'default',
  customer: 'default',
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
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

  const params = await searchParams
  const statusFilter = params.status === 'all' ? undefined : params.status
  const leads = await getLeads(profile.organization_id, statusFilter)

  return <LeadsPageClient leads={leads} organizationId={profile.organization_id} initialStatus={params.status} />
}

