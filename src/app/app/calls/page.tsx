import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CallFilters } from '@/components/calls/CallFilters'
import { CallsTableWithSelection } from '@/components/calls/CallsTableWithSelection'
import { CallsMobileTableWithSelection } from '@/components/calls/CallsMobileTableWithSelection'
import { AutoRefresh } from '@/components/calls/AutoRefresh'
import { ExportButton } from '@/components/export/ExportButton'

async function getCalls(organizationId: string, searchParams: { direction?: string; status?: string; dateFrom?: string; dateTo?: string }) {
  try {
    const supabase = createServerClient()
    let query = supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null) // Only show non-deleted calls
      .order('created_at', { ascending: false })
      .limit(50)

    if (searchParams.direction && searchParams.direction !== 'all') {
      query = query.eq('direction', searchParams.direction)
    }

    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status', searchParams.status)
    }

    if (searchParams.dateFrom) {
      query = query.gte('created_at', searchParams.dateFrom)
    }

    if (searchParams.dateTo) {
      query = query.lte('created_at', searchParams.dateTo)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('[CallsPage] Error fetching calls:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('[CallsPage] Exception in getCalls:', error)
    return []
  }
}

export const dynamic = 'force-dynamic'

export default async function CallsPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string; status?: string; dateFrom?: string; dateTo?: string }>
}) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return <div>Not authenticated</div>
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (!profile?.organization_id) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold tracking-tight mb-2">No Organization Found</h2>
            <p className="text-muted-foreground">
              Please contact support to set up your organization.
            </p>
          </div>
        </div>
      )
    }

    let params: { direction?: string; status?: string; dateFrom?: string; dateTo?: string } = {}
    try {
      params = await searchParams || {}
    } catch (e) {
      console.error('[CallsPage] Error reading searchParams:', e)
      params = {}
    }
    
    const calls = await getCalls(profile.organization_id, params)

    // Pass full calls array to client components - they can handle the full database types
    // The client components will handle serialization and formatting
    const fullCalls = Array.isArray(calls) ? calls.filter(call => call && call.id) : []

    return (
      <div className="space-y-6">
        <AutoRefresh interval={30000} /> {/* Auto-refresh every 30 seconds */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Calls</h2>
            <p className="text-muted-foreground">
              View and filter all your call activity
            </p>
          </div>
          <ExportButton organizationId={profile.organization_id} type="calls" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Calls</CardTitle>
            <CardDescription>Filter and view your call history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-4">
              <CallFilters 
                defaultDirection={params?.direction || 'all'}
                defaultStatus={params?.status || 'all'}
                defaultDateFrom={params?.dateFrom}
                defaultDateTo={params?.dateTo}
              />
            </div>
            
            {/* Mobile Card View */}
            <div className="block md:hidden">
              <CallsMobileTableWithSelection calls={fullCalls} />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <CallsTableWithSelection calls={fullCalls} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (error: any) {
    console.error('[CallsPage] Error rendering page:', error)
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Error Loading Calls</h2>
          <p className="text-muted-foreground mb-4">
            An error occurred while loading your calls. Please try refreshing the page.
          </p>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    )
  }
}

