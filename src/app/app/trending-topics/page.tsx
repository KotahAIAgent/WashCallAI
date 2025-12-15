import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Tag } from 'lucide-react'
import { format } from 'date-fns'

export const metadata: Metadata = {
  title: 'Trending Topics | FusionCaller',
  description: 'Hot topics across your conversations',
}

export default async function TrendingTopicsPage() {
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

  // Get trending topics
  const { data: topics } = await supabase
    .from('trending_topics')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .eq('time_period', 'daily')
    .order('mention_count', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          Trending Topics
        </h1>
        <p className="text-muted-foreground mt-2">
          Hot topics and trending conversations across your calls
        </p>
      </div>

      {!topics || topics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No trending topics yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Topics are automatically extracted from your calls and will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic: any) => (
            <Card key={topic.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {topic.topic}
                </CardTitle>
                <CardDescription>
                  Mentioned {topic.mention_count} time{topic.mention_count !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">First mentioned</span>
                    <span>{format(new Date(topic.first_mentioned_at), 'MMM d')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last mentioned</span>
                    <span>{format(new Date(topic.last_mentioned_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Badge variant="secondary" className="w-full justify-center">
                      {topic.mention_count} mentions
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

