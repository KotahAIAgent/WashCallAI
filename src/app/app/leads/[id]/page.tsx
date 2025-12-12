import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Play,
  User
} from 'lucide-react'
import { UpdateLeadForm } from '@/components/leads/UpdateLeadForm'
import { CallRecordingPlayer } from '@/components/leads/CallRecordingPlayer'

async function getLead(leadId: string, organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('organization_id', organizationId)
    .single()

  return data
}

async function getLeadCalls(leadId: string, organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('calls')
    .select('*')
    .eq('lead_id', leadId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  return data || []
}

async function getLeadAppointments(leadId: string, organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('appointments')
    .select('*')
    .eq('lead_id', leadId)
    .eq('organization_id', organizationId)
    .order('start_time', { ascending: false })

  return data || []
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
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

  const { id } = await params
  const lead = await getLead(id, profile.organization_id)
  const calls = await getLeadCalls(id, profile.organization_id)
  const appointments = await getLeadAppointments(id, profile.organization_id)

  if (!lead) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/leads">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              {lead.name || 'Unknown Lead'}
            </h2>
            <p className="text-muted-foreground">{lead.phone}</p>
          </div>
        </div>
        <Badge 
          variant={
            lead.status === 'interested' || lead.status === 'booked' ? 'default' :
            lead.status === 'customer' ? 'default' :
            lead.status === 'not_interested' ? 'destructive' :
            'secondary'
          }
          className="text-sm"
        >
          {lead.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Information */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
            <CardDescription>Update lead details and status</CardDescription>
          </CardHeader>
          <CardContent>
            <UpdateLeadForm lead={lead} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Call History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call History
              </CardTitle>
              <CardDescription>{calls.length} call(s) recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No calls recorded yet
                </p>
              ) : (
                <div className="space-y-4">
                  {calls.map((call) => {
                    // Safely handle date formatting
                    let formattedDate = 'N/A'
                    try {
                      if (call.created_at) {
                        formattedDate = format(new Date(call.created_at), 'MMM d, yyyy h:mm a')
                      }
                    } catch (e) {
                      console.error('Error formatting date:', e)
                    }

                    // Safely handle duration formatting
                    let formattedDuration = 'N/A'
                    try {
                      if (call.duration_seconds && call.duration_seconds > 0) {
                        const mins = Math.floor(call.duration_seconds / 60)
                        const secs = call.duration_seconds % 60
                        formattedDuration = `${mins}:${secs.toString().padStart(2, '0')}`
                      }
                    } catch (e) {
                      console.error('Error formatting duration:', e)
                    }

                    return (
                      <div key={call.id} className="border rounded-lg overflow-hidden">
                        {/* Call Header */}
                        <div className="flex items-center justify-between p-3 bg-muted/50">
                          <div className="flex items-center gap-3">
                            {call.direction === 'inbound' ? (
                              <PhoneIncoming className="h-4 w-4 text-green-600" />
                            ) : (
                              <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                            )}
                            <div>
                              <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                                {call.direction || 'unknown'}
                              </Badge>
                              <span className="ml-2 text-sm text-muted-foreground">
                                {formattedDate}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {call.duration_seconds && call.duration_seconds > 0 && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formattedDuration}
                              </span>
                            )}
                            <Badge variant="outline">{call.status || 'unknown'}</Badge>
                          </div>
                        </div>

                        {/* Call Details */}
                        <div className="p-3 space-y-3">
                          {/* Recording */}
                          {call.recording_url && (
                            <CallRecordingPlayer url={call.recording_url} />
                          )}

                          {/* Summary */}
                          {call.summary && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                AI Summary
                              </div>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                                {call.summary}
                              </p>
                            </div>
                          )}

                          {/* Transcript */}
                          {call.transcript && (
                            <details className="group">
                              <summary className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:text-primary">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                View Transcript
                              </summary>
                              <div className="mt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md max-h-48 overflow-y-auto">
                                <pre className="whitespace-pre-wrap font-sans">{call.transcript}</pre>
                              </div>
                            </details>
                          )}

                          {/* No details message */}
                          {!call.recording_url && !call.summary && !call.transcript && (
                            <p className="text-sm text-muted-foreground italic">
                              No recording or transcript available for this call
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointments
              </CardTitle>
              <CardDescription>{appointments.length} appointment(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No appointments scheduled
                </p>
              ) : (
                <div className="space-y-2">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="p-3 border rounded-lg">
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(appointment.start_time), 'MMM d, yyyy')}
                        <Clock className="h-3 w-3 ml-2" />
                        {format(new Date(appointment.start_time), 'h:mm a')}
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
