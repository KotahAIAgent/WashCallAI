'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Zap } from 'lucide-react'
import { WorkflowAction, WorkflowTrigger } from '@/lib/workflows/actions'

interface WorkflowBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (workflow: {
    name: string
    description?: string
    trigger_type: string
    trigger_config: Record<string, any>
    actions: WorkflowAction[]
  }) => Promise<void>
  initialWorkflow?: {
    id: string
    name: string
    description?: string
    trigger_type: string
    trigger_config: Record<string, any>
    actions: WorkflowAction[]
  }
}

const TRIGGER_TYPES = [
  { value: 'new_lead', label: 'New Lead Created' },
  { value: 'lead_status_changed', label: 'Lead Status Changed' },
  { value: 'call_completed', label: 'Call Completed' },
  { value: 'appointment_booked', label: 'Appointment Booked' },
  { value: 'lead_score_threshold', label: 'Lead Score Reaches Threshold' },
  { value: 'date_based', label: 'Date-Based Trigger' },
]

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_lead_status', label: 'Update Lead Status' },
  { value: 'assign_to_team', label: 'Assign to Team Member' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'webhook', label: 'Call Webhook' },
  { value: 'schedule_followup', label: 'Schedule Follow-up Call' },
]

export function WorkflowBuilder({
  open,
  onOpenChange,
  onSubmit,
  initialWorkflow,
}: WorkflowBuilderProps) {
  const [name, setName] = useState(initialWorkflow?.name || '')
  const [description, setDescription] = useState(initialWorkflow?.description || '')
  const [triggerType, setTriggerType] = useState(initialWorkflow?.trigger_type || 'new_lead')
  const [triggerConfig, setTriggerConfig] = useState(initialWorkflow?.trigger_config || {})
  const [actions, setActions] = useState<WorkflowAction[]>(initialWorkflow?.actions || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddAction = () => {
    setActions([...actions, { type: 'send_email', config: {} }])
  }

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const handleUpdateAction = (index: number, updates: Partial<WorkflowAction>) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], ...updates }
    setActions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || actions.length === 0) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        description,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        actions,
      })
      // Reset form
      setName('')
      setDescription('')
      setTriggerType('new_lead')
      setTriggerConfig({})
      setActions([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating workflow:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialWorkflow ? 'Edit Workflow' : 'Create Workflow'}</DialogTitle>
          <DialogDescription>
            Build automated workflows that trigger actions based on events
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Welcome New Lead"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={2}
              />
            </div>
          </div>

          {/* Trigger */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>When this happens... *</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger-specific config */}
            {triggerType === 'lead_status_changed' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={triggerConfig.status || ''}
                  onValueChange={(value) => setTriggerConfig({ ...triggerConfig, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {triggerType === 'lead_score_threshold' && (
              <div className="space-y-2">
                <Label>Score Threshold</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={triggerConfig.threshold || ''}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, threshold: parseInt(e.target.value) })}
                  placeholder="e.g., 80"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Then do this... *</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddAction}>
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No actions yet. Add an action to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Select
                        value={action.type}
                        onValueChange={(value) => handleUpdateAction(index, { type: value as any, config: {} })}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map((actionType) => (
                            <SelectItem key={actionType.value} value={actionType.value}>
                              {actionType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAction(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Action-specific config */}
                    {action.type === 'send_email' && (
                      <div className="space-y-2">
                        <Label>Email Template</Label>
                        <Input
                          placeholder="Template name or subject"
                          value={action.config.template || ''}
                          onChange={(e) => handleUpdateAction(index, {
                            config: { ...action.config, template: e.target.value },
                          })}
                        />
                      </div>
                    )}

                    {action.type === 'update_lead_status' && (
                      <div className="space-y-2">
                        <Label>New Status</Label>
                        <Select
                          value={action.config.status || ''}
                          onValueChange={(value) => handleUpdateAction(index, {
                            config: { ...action.config, status: value },
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interested">Interested</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {action.type === 'add_tag' && (
                      <div className="space-y-2">
                        <Label>Tag Name</Label>
                        <Input
                          placeholder="e.g., high-priority"
                          value={action.config.tag || ''}
                          onChange={(e) => handleUpdateAction(index, {
                            config: { ...action.config, tag: e.target.value },
                          })}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || actions.length === 0}>
              {isSubmitting ? 'Saving...' : initialWorkflow ? 'Update Workflow' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

