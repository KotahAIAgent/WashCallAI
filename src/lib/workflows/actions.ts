'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'create_task' | 'update_lead_status' | 'assign_to_team' | 'add_tag' | 'webhook' | 'schedule_followup'
  config: Record<string, any>
}

export interface WorkflowTrigger {
  type: 'new_lead' | 'lead_status_changed' | 'call_completed' | 'appointment_booked' | 'lead_score_threshold' | 'date_based' | 'manual'
  config: Record<string, any>
}

export interface Workflow {
  id: string
  name: string
  description?: string
  enabled: boolean
  trigger_type: string
  trigger_config: Record<string, any>
  actions: WorkflowAction[]
  execution_count: number
  last_executed_at?: string
}

export async function getWorkflows(organizationId: string) {
  const supabase = createActionClient()
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { workflows: data || [] }
}

export async function createWorkflow(
  organizationId: string,
  workflow: {
    name: string
    description?: string
    trigger_type: string
    trigger_config: Record<string, any>
    actions: WorkflowAction[]
  }
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('workflows')
    .insert({
      organization_id: organizationId,
      name: workflow.name,
      description: workflow.description,
      trigger_type: workflow.trigger_type,
      trigger_config: workflow.trigger_config,
      actions: workflow.actions,
      created_by: session.user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/workflows')
  return { workflow: data }
}

export async function updateWorkflow(
  workflowId: string,
  updates: {
    name?: string
    description?: string
    enabled?: boolean
    trigger_type?: string
    trigger_config?: Record<string, any>
    actions?: WorkflowAction[]
  }
) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('workflows')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workflowId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/workflows')
  return { workflow: data }
}

export async function deleteWorkflow(workflowId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/workflows')
  return { success: true }
}

export async function getWorkflowExecutions(workflowId: string, limit = 50) {
  const supabase = createActionClient()
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: error.message }
  }

  return { executions: data || [] }
}

