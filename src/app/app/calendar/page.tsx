import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { CalendarView } from '@/components/calendar/CalendarView'

async function getAppointments(organizationId: string, startDate: Date, endDate: Date) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('appointments')
    .select(`
      *,
      leads (
        id,
        name,
        phone,
        address,
        city,
        state
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true })

  return data || []
}

async function getUpcomingAppointments(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('appointments')
    .select(`
      *,
      leads (
        id,
        name,
        phone,
        address,
        city,
        state
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(10)

  return data || []
}

export default async function CalendarPage() {
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

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const [appointments, upcomingAppointments] = await Promise.all([
    getAppointments(profile.organization_id, calendarStart, calendarEnd),
    getUpcomingAppointments(profile.organization_id)
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
          <p className="text-muted-foreground">
            View and manage your booked appointments
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <CalendarView appointments={appointments} />
        </div>

        {/* Upcoming Appointments Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
              <CardDescription>Your next scheduled estimates</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No upcoming appointments</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Appointments booked by your AI will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt: any) => (
                    <div 
                      key={apt.id} 
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium truncate">{apt.title}</h4>
                        <Badge variant={isToday(new Date(apt.start_time)) ? 'default' : 'outline'}>
                          {isToday(new Date(apt.start_time)) 
                            ? 'Today' 
                            : format(new Date(apt.start_time), 'MMM d')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{format(new Date(apt.start_time), 'h:mm a')}</span>
                        </div>
                        
                        {apt.leads && (
                          <>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              <span>{apt.leads.name || 'Unknown'}</span>
                            </div>
                            {apt.leads.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{apt.leads.phone}</span>
                              </div>
                            )}
                            {(apt.leads.address || apt.leads.city) && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate">
                                  {[apt.leads.address, apt.leads.city, apt.leads.state]
                                    .filter(Boolean)
                                    .join(', ')}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {apt.leads?.id && (
                        <div className="mt-3 pt-3 border-t">
                          <Link href={`/app/leads/${apt.leads.id}`}>
                            <Button variant="ghost" size="sm" className="w-full">
                              View Lead Details
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">appointments scheduled</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

