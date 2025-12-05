'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Clock, Phone, MessageSquare, CheckSquare, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { 
  getFollowUpRules, 
  createFollowUpRule, 
  updateFollowUpRule, 
  deleteFollowUpRule 
} from '@/lib/followups/actions'

interface Rule {
  id: string
  name: string
  enabled: boolean
  trigger_status: string
  action: string
  delay_hours: number
  max_attempts: number
  only_during_business_hours: boolean
  message_template: string | null
}

interface FollowUpRulesFormProps {
  organizationId: string
}

export function FollowUpRulesForm({ organizationId }: FollowUpRulesFormProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  // New rule form state
  const [newRule, setNewRule] = useState({
    name: '',
    triggerStatus: 'no_answer' as const,
    action: 'schedule_call' as const,
    delayHours: 24,
    maxAttempts: 3,
    onlyDuringBusinessHours: true,
    messageTemplate: '',
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setIsLoading(true)
    const result = await getFollowUpRules(organizationId)
    if (!result.error) {
      setRules(result.rules || [])
    }
    setIsLoading(false)
  }

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a rule name',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    const result = await createFollowUpRule({
      organizationId,
      name: newRule.name,
      triggerStatus: newRule.triggerStatus,
      action: newRule.action,
      delayHours: newRule.delayHours,
      maxAttempts: newRule.maxAttempts,
      onlyDuringBusinessHours: newRule.onlyDuringBusinessHours,
      messageTemplate: newRule.action === 'send_sms' ? newRule.messageTemplate : undefined,
    })

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else if (result.rule) {
      setRules(prev => [...prev, result.rule!])
      setIsDialogOpen(false)
      resetForm()
      toast({
        title: 'Rule Created',
        description: 'Your follow-up rule has been saved.',
      })
    }
    setIsCreating(false)
  }

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    const result = await updateFollowUpRule(ruleId, { enabled })
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r))
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    const result = await deleteFollowUpRule(ruleId)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      setRules(prev => prev.filter(r => r.id !== ruleId))
      toast({
        title: 'Rule Deleted',
        description: 'The follow-up rule has been removed.',
      })
    }
  }

  const resetForm = () => {
    setNewRule({
      name: '',
      triggerStatus: 'no_answer',
      action: 'schedule_call',
      delayHours: 24,
      maxAttempts: 3,
      onlyDuringBusinessHours: true,
      messageTemplate: '',
    })
  }

  const getTriggerLabel = (status: string) => {
    switch (status) {
      case 'no_answer': return 'No Answer'
      case 'voicemail': return 'Voicemail Left'
      case 'callback': return 'Callback Requested'
      case 'interested': return 'Interested'
      default: return status
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'schedule_call': return <Phone className="h-4 w-4" />
      case 'send_sms': return <MessageSquare className="h-4 w-4" />
      case 'create_task': return <CheckSquare className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'schedule_call': return 'Schedule Call'
      case 'send_sms': return 'Send SMS'
      case 'create_task': return 'Create Task'
      default: return action
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Automated Follow-ups
            </CardTitle>
            <CardDescription>
              Set up rules to automatically follow up with leads based on call outcomes.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Follow-up Rule</DialogTitle>
                <DialogDescription>
                  Configure when and how to automatically follow up with leads.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    placeholder="e.g., Follow up on no answers"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>When this happens...</Label>
                  <Select
                    value={newRule.triggerStatus}
                    onValueChange={(v: any) => setNewRule(prev => ({ ...prev, triggerStatus: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_answer">No Answer</SelectItem>
                      <SelectItem value="voicemail">Voicemail Left</SelectItem>
                      <SelectItem value="callback">Callback Requested</SelectItem>
                      <SelectItem value="interested">Interested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Then do this...</Label>
                  <Select
                    value={newRule.action}
                    onValueChange={(v: any) => setNewRule(prev => ({ ...prev, action: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule_call">Schedule Another Call</SelectItem>
                      <SelectItem value="send_sms">Send SMS</SelectItem>
                      <SelectItem value="create_task">Create Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Wait (hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newRule.delayHours}
                      onChange={(e) => setNewRule(prev => ({ ...prev, delayHours: parseInt(e.target.value) || 24 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Attempts</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={newRule.maxAttempts}
                      onChange={(e) => setNewRule(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 3 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Only during business hours</Label>
                  <Switch
                    checked={newRule.onlyDuringBusinessHours}
                    onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, onlyDuringBusinessHours: checked }))}
                  />
                </div>

                {newRule.action === 'send_sms' && (
                  <div className="space-y-2">
                    <Label>SMS Message Template</Label>
                    <Textarea
                      placeholder="Hi {name}, we tried reaching you about our pressure washing services..."
                      value={newRule.messageTemplate}
                      onChange={(e) => setNewRule(prev => ({ ...prev, messageTemplate: e.target.value }))}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{name}'} for lead name, {'{company}'} for your company name
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No follow-up rules yet</p>
            <p className="text-sm">Create a rule to automate your follow-ups</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border ${rule.enabled ? 'bg-background' : 'bg-muted/30 opacity-60'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getActionIcon(rule.action)}
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">
                        When <span className="font-medium">{getTriggerLabel(rule.trigger_status)}</span>
                        {' → '}{getActionLabel(rule.action)}
                        {' after '}<span className="font-medium">{rule.delay_hours}h</span>
                        {' (max '}{rule.max_attempts}{' attempts)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

