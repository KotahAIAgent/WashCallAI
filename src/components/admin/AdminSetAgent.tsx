'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { adminSetAgentId } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'
import { Bot, Loader2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
}

export function AdminSetAgent({ organizations }: { organizations: Organization[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState('')
  const [agentType, setAgentType] = useState<'inbound' | 'outbound'>('inbound')
  const [agentId, setAgentId] = useState('')
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedOrg || !agentId) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    const result = await adminSetAgentId(selectedOrg, agentType, agentId)
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: `${agentType === 'inbound' ? 'Inbound' : 'Outbound'} agent configured successfully`,
      })
      setAgentId('')
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Configure Agent
        </CardTitle>
        <CardDescription>
          Set up Vapi agent IDs for an organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agent Type</Label>
            <Select value={agentType} onValueChange={(v) => setAgentType(v as 'inbound' | 'outbound')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">Inbound Agent</SelectItem>
                <SelectItem value="outbound">Outbound Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vapi Assistant ID</Label>
            <Input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="assistant_xxxxx or asst_xxxxx"
            />
            <p className="text-xs text-muted-foreground">
              Get this from Vapi dashboard → Assistants → Copy ID
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Set Agent ID'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

