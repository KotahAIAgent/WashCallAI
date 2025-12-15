import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CallIntelligence } from '@/components/calls/CallIntelligence'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Call Intelligence | FusionCaller',
  description: 'AI-powered call insights and analytics',
}

export default async function CallIntelligencePage() {
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

  // Get calls with intelligence data
  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .not('transcript', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered insights from your calls: sentiment, topics, and structured notes
        </p>
      </div>

      {!calls || calls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No calls with intelligence data yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Intelligence is automatically generated after calls complete.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {calls.map((call: any) => {
            // Parse intelligence data from the call record
            const sentiment = call.sentiment
            const sentimentScore = call.sentiment_score
            const topics = call.topics
            const aiNotes = call.ai_notes
            const talkTime = call.talk_time_seconds
            const listenTime = call.listen_time_seconds
            const talkListenRatio = call.talk_listen_ratio

            return (
              <Card key={call.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {call.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={call.direction === 'inbound' ? 'default' : 'secondary'}>
                        {call.direction}
                      </Badge>
                      <Badge variant="outline">{call.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CallIntelligence
                    sentiment={sentiment}
                    sentimentScore={sentimentScore}
                    topics={topics}
                    aiNotes={aiNotes}
                    talkTimeSeconds={talkTime}
                    listenTimeSeconds={listenTime}
                    talkListenRatio={talkListenRatio}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

