import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CallDetailSheet } from '@/components/dashboard/CallDetailSheet'
import { CallFilters } from '@/components/calls/CallFilters'
import { CallsMobileTable } from '@/components/calls/CallsMobileTable'
import { AutoRefresh } from '@/components/calls/AutoRefresh'
import { ExportButton } from '@/components/export/ExportButton'

async function getCalls(organizationId: string, searchParams: { direction?: string; status?: string; dateFrom?: string; dateTo?: string }) {
  try {
    const supabase = createServerClient()
    let query = supabase
      .from('calls')
      .select('*')
      .eq('organization_id', organizationId)
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

    // Ensure calls is always an array and filter out any invalid entries
    // Also ensure all required fields exist with defaults and pre-format dates
    // Only include serializable properties to avoid server component errors
    const validCalls = Array.isArray(calls) 
      ? calls
          .filter(call => call && call.id)
          .map(call => {
            let formattedDate = 'N/A'
            try {
              if (call.created_at) {
                const date = new Date(call.created_at)
                if (!isNaN(date.getTime())) {
                  // Use native JavaScript date formatting instead of date-fns
                  formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                }
              }
            } catch (e) {
              // Keep as 'N/A'
            }
            
            // Explicitly select only serializable properties
            return {
              id: String(call.id || ''),
              direction: String(call.direction || 'unknown'),
              status: String(call.status || 'unknown'),
              from_number: call.from_number ? String(call.from_number) : null,
              to_number: call.to_number ? String(call.to_number) : null,
              organization_phone_number: call.organization_phone_number ? String(call.organization_phone_number) : null,
              duration_seconds: call.duration_seconds ? Number(call.duration_seconds) : null,
              created_at: call.created_at ? String(call.created_at) : null,
              formatted_date: formattedDate,
              summary: call.summary ? String(call.summary) : null,
              transcript: call.transcript ? String(call.transcript) : null,
              recording_url: call.recording_url ? String(call.recording_url) : null,
              organization_id: String(call.organization_id || ''),
            }
          })
      : []

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
              <CallsMobileTable calls={validCalls} />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Your Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No calls found
                      </TableCell>
                    </TableRow>
                  ) : (
                    validCalls.map((call: any) => (
                      <TableRow key={call.id}>
                        <TableCell>
                          <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                            {call.direction || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{call.from_number || 'N/A'}</TableCell>
                        <TableCell>{call.to_number || 'N/A'}</TableCell>
                        <TableCell className="font-medium">
                          {call.organization_phone_number || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{call.status || 'unknown'}</Badge>
                        </TableCell>
                        <TableCell>{call.duration_seconds ? `${call.duration_seconds}s` : 'N/A'}</TableCell>
                        <TableCell>{call.formatted_date || 'N/A'}</TableCell>
                        <TableCell>
                          <CallDetailSheet call={call} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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

