'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Play, Pause, Edit, Trash2, Zap } from 'lucide-react'
import { Workflow } from '@/lib/workflows/actions'
import { formatDistanceToNow } from 'date-fns'

interface WorkflowCardProps {
  workflow: Workflow
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
}

export function WorkflowCard({
  workflow,
  onToggle,
  onEdit,
  onDelete,
  onTest,
}: WorkflowCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{workflow.name}</CardTitle>
              <Badge variant={workflow.enabled ? 'default' : 'outline'}>
                {workflow.enabled ? 'Active' : 'Paused'}
              </Badge>
            </div>
            {workflow.description && (
              <CardDescription>{workflow.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(workflow.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTest(workflow.id)}>
                <Play className="h-4 w-4 mr-2" />
                Test Run
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(workflow.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Trigger</p>
            <p className="text-sm text-muted-foreground capitalize">
              {workflow.trigger_type.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Enabled</span>
            <Switch
              checked={workflow.enabled}
              onCheckedChange={(checked) => onToggle(workflow.id, checked)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Actions</p>
          <div className="flex flex-wrap gap-2">
            {workflow.actions.map((action, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {action.type.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>
            Executed {workflow.execution_count} time{workflow.execution_count !== 1 ? 's' : ''}
          </span>
          {workflow.last_executed_at && (
            <span>
              {formatDistanceToNow(new Date(workflow.last_executed_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

