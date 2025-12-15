import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateAssistantDialog } from '@/components/assistants/CreateAssistantDialog'
import { getAssistants } from '@/lib/assistants/actions'
import { Bot, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteAssistant } from '@/lib/assistants/actions'
import { AssistantActions } from '@/components/assistants/AssistantActions'

export default async function AssistantsPage() {
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

  const result = await getAssistants(profile.organization_id)
  const assistants = result.assistants || []

  const inboundAssistants = assistants.filter(a => a.type === 'inbound')
  const outboundAssistants = assistants.filter(a => a.type === 'outbound')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Assistants</h2>
          <p className="text-muted-foreground">
            Create and manage your AI assistants for inbound and outbound calls
          </p>
        </div>
        <div className="flex gap-2">
          <CreateAssistantDialog organizationId={profile.organization_id} type="inbound" />
          <CreateAssistantDialog organizationId={profile.organization_id} type="outbound" />
        </div>
      </div>

      {/* Inbound Assistants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Inbound Assistants
          </CardTitle>
          <CardDescription>
            Assistants that handle incoming calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inboundAssistants.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No inbound assistants yet. Create one to get started.
              </p>
              <CreateAssistantDialog organizationId={profile.organization_id} type="inbound" />
            </div>
          ) : (
            <div className="space-y-3">
              {inboundAssistants.map((assistant) => (
                <AssistantActions
                  key={assistant.id}
                  assistant={assistant}
                  organizationId={profile.organization_id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outbound Assistants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Outbound Assistants
          </CardTitle>
          <CardDescription>
            Assistants that make outbound calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {outboundAssistants.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No outbound assistants yet. Create one to get started.
              </p>
              <CreateAssistantDialog organizationId={profile.organization_id} type="outbound" />
            </div>
          ) : (
            <div className="space-y-3">
              {outboundAssistants.map((assistant) => (
                <AssistantActions
                  key={assistant.id}
                  assistant={assistant}
                  organizationId={profile.organization_id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

