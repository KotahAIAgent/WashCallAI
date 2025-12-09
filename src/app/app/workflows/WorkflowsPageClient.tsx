'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Workflow, createWorkflow, updateWorkflow, deleteWorkflow } from '@/lib/workflows/actions'
import { useToast } from '@/hooks/use-toast'
import { Plus, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WorkflowsPageClientProps {
  initialWorkflows: Workflow[]
  organizationId: string
}

export function WorkflowsPageClient({
  initialWorkflows,
  organizationId,
}: WorkflowsPageClientProps) {
  const [workflows, setWorkflows] = useState(initialWorkflows)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleCreate = async (workflowData: any) => {
    const result = await createWorkflow(organizationId, workflowData)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Workflow created', description: 'Your workflow is now active' })
      router.refresh()
    }
  }

  const handleUpdate = async (workflowId: string, updates: any) => {
    const result = await updateWorkflow(workflowId, updates)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Workflow updated' })
      router.refresh()
    }
  }

  const handleToggle = async (workflowId: string, enabled: boolean) => {
    await handleUpdate(workflowId, { enabled })
  }

  const handleDelete = (workflowId: string) => {
    setWorkflowToDelete(workflowId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!workflowToDelete) return
    const result = await deleteWorkflow(workflowToDelete)
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({ title: 'Workflow deleted' })
      setWorkflows(workflows.filter(w => w.id !== workflowToDelete))
      setWorkflowToDelete(null)
    }
  }

  const handleEdit = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    setEditingWorkflow(workflow)
    setBuilderOpen(true)
  }

  const handleTest = (workflowId: string) => {
    toast({
      title: 'Test Run',
      description: 'Workflow test execution would be triggered here',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Workflows
          </h2>
          <p className="text-muted-foreground">
            Automate your workflow with triggers and actions
          </p>
        </div>
        <Button onClick={() => {
          setEditingWorkflow(undefined)
          setBuilderOpen(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              Create automated workflows to save time and never miss an opportunity
            </p>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTest={handleTest}
            />
          ))}
        </div>
      )}

      {/* Workflow Builder */}
      <WorkflowBuilder
        open={builderOpen}
        onOpenChange={(open) => {
          setBuilderOpen(open)
          if (!open) setEditingWorkflow(undefined)
        }}
        onSubmit={editingWorkflow
          ? (data) => handleUpdate(editingWorkflow.id, data)
          : handleCreate
        }
        initialWorkflow={editingWorkflow}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Workflow"
        description="Are you sure you want to delete this workflow? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  )
}

