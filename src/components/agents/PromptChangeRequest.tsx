'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Loader2 } from 'lucide-react'
import { submitPromptChangeRequest } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'

interface PromptChangeRequestProps {
  organizationId: string
  agentType: 'inbound' | 'outbound' | 'both'
}

export function PromptChangeRequest({ organizationId, agentType }: PromptChangeRequestProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requestedChanges, setRequestedChanges] = useState('')
  const [reason, setReason] = useState('')
  const [priority, setPriority] = useState('normal')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!requestedChanges.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe the changes you want to make.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const result = await submitPromptChangeRequest({
      organizationId,
      agentType,
      requestedChanges,
      reason: reason || null,
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
    })

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Request submitted',
        description: 'Your prompt change request has been submitted. We\'ll review it and get back to you.',
      })
      setOpen(false)
      setRequestedChanges('')
      setReason('')
      setPriority('normal')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Request Prompt Changes
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Request Prompt Changes
        </CardTitle>
        <CardDescription>
          Describe how you'd like your {agentType} agent's behavior or responses to change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>What changes would you like?</Label>
            <Textarea
              value={requestedChanges}
              onChange={(e) => setRequestedChanges(e.target.value)}
              placeholder="e.g., Make the agent more formal, add information about our new service, change the greeting to mention our special offer..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you requesting this change?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Nice to have</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High - Important</SelectItem>
                <SelectItem value="urgent">Urgent - Blocking issue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setRequestedChanges('')
                setReason('')
                setPriority('normal')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

