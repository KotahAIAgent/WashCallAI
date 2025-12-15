import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Radio as RadioIcon, Phone, Clock } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Live Calls | FusionCaller',
  description: 'Monitor live calls in real-time',
}

export default async function LiveCallsPage() {
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

  // Get live calls
  const { data: liveCalls } = await supabase
    .from('live_calls')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .in('status', ['ringing', 'answered', 'in_progress'])
    .order('started_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RadioIcon className="h-8 w-8 text-green-500" />
          Live Calls
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor active calls in real-time
        </p>
      </div>

      {!liveCalls || liveCalls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RadioIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No live calls at the moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Active calls will appear here in real-time
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {liveCalls.map((call: any) => (
            <Card key={call.id} className="border-green-200 bg-green-50/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500 animate-pulse">
                      <RadioIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {call.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call
                      </CardTitle>
                      <CardDescription>
                        Started {format(new Date(call.started_at), 'h:mm:ss a')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    {call.status === 'ringing' && 'Ringing'}
                    {call.status === 'answered' && 'Answered'}
                    {call.status === 'in_progress' && 'In Progress'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">From:</span>
                    <span className="ml-2 font-medium">{call.from_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To:</span>
                    <span className="ml-2 font-medium">{call.to_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {Math.floor((Date.now() - new Date(call.started_at).getTime()) / 1000)}s
                    </span>
                  </div>
                </div>

                {call.stream_url && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Live Audio Stream:</p>
                    <audio controls src={call.stream_url} className="w-full" />
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Real-time monitoring is available for active calls. You can listen in to provide support or quality assurance.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">About Live Monitoring</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Monitor active calls in real-time for training and quality assurance</li>
            <li>Listen to live audio streams (when available)</li>
            <li>Calls appear automatically when they start and disappear when they end</li>
            <li>All live monitoring complies with applicable call recording laws</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

