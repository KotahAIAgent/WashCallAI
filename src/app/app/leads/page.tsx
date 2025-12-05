import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ExportButton } from '@/components/export/ExportButton'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowRight } from 'lucide-react'

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Inbound Leads</h2>
          <p className="text-sm text-muted-foreground">
            Leads captured from inbound calls and inquiries
          </p>
        </div>
        <ExportButton organizationId={profile.organization_id} type="leads" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Inbound Leads</CardTitle>
          <CardDescription>Leads from inbound calls - filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <form method="get" className="flex flex-col sm:flex-row gap-2">
              <Select name="status" defaultValue={params.status || 'all'}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="call_back">Call Back</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full sm:w-auto">Filter</Button>
            </form>
          </div>
          
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leads found
              </div>
            ) : (
              leads.map((lead) => (
                <Link key={lead.id} href={`/app/leads/${lead.id}`} className="block">
                  <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{lead.name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{lead.phone || 'No phone'}</p>
                      </div>
                      <Badge variant={statusColors[lead.status] || 'outline'} className="flex-shrink-0">
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
                      {lead.property_type && (
                        <Badge variant="outline" className="text-xs">{lead.property_type}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Property Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name || 'N/A'}</TableCell>
                      <TableCell>{lead.phone || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{lead.email || 'N/A'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {lead.property_type ? (
                          <Badge variant="outline">{lead.property_type}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[lead.status] || 'outline'}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(lead.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Link href={`/app/leads/${lead.id}`}>
                          <Button variant="ghost" size="sm">
                            View <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
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
}

