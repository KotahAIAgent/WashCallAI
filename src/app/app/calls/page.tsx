import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CallDetailSheet } from '@/components/dashboard/CallDetailSheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/export/ExportButton'
import { MobileTable } from '@/components/ui/mobile-table'
import { format } from 'date-fns'

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

    const params = await searchParams
    const calls = await getCalls(profile.organization_id, params)

    // Ensure calls is always an array and filter out any invalid entries
    const validCalls = Array.isArray(calls) ? calls.filter(call => call && call.id) : []

    return (
      <div className="space-y-6">
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
              <form method="get" className="flex flex-wrap gap-4">
                <Select name="direction" defaultValue={params.direction || 'all'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Directions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Directions</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                  </SelectContent>
                </Select>
                <Select name="status" defaultValue={params.status || 'all'}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="ringing">Ringing</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  name="dateFrom"
                  placeholder="From Date"
                  defaultValue={params.dateFrom}
                  className="w-[180px]"
                />
                <Input
                  type="date"
                  name="dateTo"
                  placeholder="To Date"
                  defaultValue={params.dateTo}
                  className="w-[180px]"
                />
                <Button type="submit">Filter</Button>
              </form>
            </div>
            
            {/* Mobile Card View */}
            <div className="block md:hidden">
              <MobileTable
                items={validCalls}
                columns={[
                  {
                    key: 'direction',
                    label: 'Direction',
                    render: (call) => (
                      <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                        {call.direction || 'unknown'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'from_number',
                    label: 'From',
                    render: (call) => call.from_number || 'N/A',
                  },
                  {
                    key: 'to_number',
                    label: 'To',
                    render: (call) => call.to_number || 'N/A',
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (call) => (
                      <Badge variant="outline">{call.status || 'unknown'}</Badge>
                    ),
                  },
                  {
                    key: 'duration_seconds',
                    label: 'Duration',
                    render: (call) => call.duration_seconds ? `${call.duration_seconds}s` : 'N/A',
                  },
                  {
                    key: 'created_at',
                    label: 'Date',
                    render: (call) => {
                      try {
                        if (call.created_at) {
                          return format(new Date(call.created_at), 'MMM d, yyyy h:mm a')
                        }
                        return 'N/A'
                      } catch (e) {
                        return 'N/A'
                      }
                    },
                  },
                ]}
                emptyMessage="No calls found"
              />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Direction</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No calls found
                      </TableCell>
                    </TableRow>
                  ) : (
                    validCalls.map((call) => {
                      // Safely handle date formatting
                      let formattedDate = 'N/A'
                      try {
                        if (call.created_at) {
                          formattedDate = format(new Date(call.created_at), 'MMM d, yyyy h:mm a')
                        }
                      } catch (e) {
                        console.error('Error formatting date:', e)
                      }

                      return (
                        <TableRow key={call.id}>
                          <TableCell>
                            <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                              {call.direction || 'unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>{call.from_number || 'N/A'}</TableCell>
                          <TableCell>{call.to_number || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{call.status || 'unknown'}</Badge>
                          </TableCell>
                          <TableCell>{call.duration_seconds ? `${call.duration_seconds}s` : 'N/A'}</TableCell>
                          <TableCell>{formattedDate}</TableCell>
                          <TableCell>
                            <CallDetailSheet call={call} />
                          </TableCell>
                        </TableRow>
                      )
                    })
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

  return (
    <div className="space-y-6">
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
            <form method="get" className="flex flex-wrap gap-4">
              <Select name="direction" defaultValue={params.direction || 'all'}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
              <Select name="status" defaultValue={params.status || 'all'}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="ringing">Ringing</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                name="dateFrom"
                placeholder="From Date"
                defaultValue={params.dateFrom}
                className="w-[180px]"
              />
              <Input
                type="date"
                name="dateTo"
                placeholder="To Date"
                defaultValue={params.dateTo}
                className="w-[180px]"
              />
              <Button type="submit">Filter</Button>
            </form>
          </div>
          
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <MobileTable
              items={calls}
              columns={[
                {
                  key: 'direction',
                  label: 'Direction',
                  render: (call) => (
                    <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                      {call.direction}
                    </Badge>
                  ),
                },
                {
                  key: 'from_number',
                  label: 'From',
                  render: (call) => call.from_number || 'N/A',
                },
                {
                  key: 'to_number',
                  label: 'To',
                  render: (call) => call.to_number || 'N/A',
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (call) => (
                    <Badge variant="outline">{call.status}</Badge>
                  ),
                },
                {
                  key: 'duration_seconds',
                  label: 'Duration',
                  render: (call) => call.duration_seconds ? `${call.duration_seconds}s` : 'N/A',
                },
                {
                  key: 'created_at',
                  label: 'Date',
                  render: (call) => {
                    try {
                      if (call.created_at) {
                        return format(new Date(call.created_at), 'MMM d, yyyy h:mm a')
                      }
                      return 'N/A'
                    } catch (e) {
                      return 'N/A'
                    }
                  },
                },
              ]}
              emptyMessage="No calls found"
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Direction</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No calls found
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => {
                    // Safely handle date formatting
                    let formattedDate = 'N/A'
                    try {
                      if (call.created_at) {
                        formattedDate = format(new Date(call.created_at), 'MMM d, yyyy h:mm a')
                      }
                    } catch (e) {
                      console.error('Error formatting date:', e)
                    }

                    return (
                      <TableRow key={call.id}>
                        <TableCell>
                          <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                            {call.direction || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{call.from_number || 'N/A'}</TableCell>
                        <TableCell>{call.to_number || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{call.status || 'unknown'}</Badge>
                        </TableCell>
                        <TableCell>{call.duration_seconds ? `${call.duration_seconds}s` : 'N/A'}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>
                          <CallDetailSheet call={call} />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

