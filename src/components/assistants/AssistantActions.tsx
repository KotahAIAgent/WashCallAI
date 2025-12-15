'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteAssistant } from '@/lib/assistants/actions'
import { useToast } from '@/hooks/use-toast'
import { Trash2, Bot, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/confirm-dialog'

interface Assistant {
  id: string
  name: string
  type: 'inbound' | 'outbound'
  assistant_id: string | null
  active: boolean
  created_at: string
  settings: any
}

interface AssistantActionsProps {
  assistant: Assistant
  organizationId: string
}

export function AssistantActions({ assistant, organizationId }: AssistantActionsProps) {
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteAssistant(assistant.id, organizationId)

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: 'Assistant deleted successfully',
      })
    }
    setDeleting(false)
  }

  const settings = assistant.settings || {}
  const voiceName = settings.voiceName || 'Default'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{assistant.name}</p>
                  <Badge variant={assistant.active ? 'default' : 'secondary'}>
                    {assistant.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">
                    {assistant.type === 'inbound' ? 'Inbound' : 'Outbound'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Voice: {voiceName} • Model: {settings.model || 'GPT-3.5 Turbo'}
                </p>
                {assistant.assistant_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {assistant.assistant_id.substring(0, 20)}...
                  </p>
                )}
              </div>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Assistant</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{assistant.name}"? This action cannot be undone.
                  The assistant will be removed from your account and can no longer be used for calls.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

