'use server'

import { createServerClient } from '@/lib/supabase/server'
import { WorkflowAction } from './actions'

interface WorkflowExecutionContext {
  organizationId: string
  leadId?: string
  callId?: string
  appointmentId?: string
  triggerData?: Record<string, any>
}

export async function executeWorkflowAction(
  action: WorkflowAction,
  context: WorkflowExecutionContext
) {
  switch (action.type) {
    case 'send_email':
      // TODO: Implement email sending
      console.log('Sending email:', action.config, context)
      break

    case 'send_sms':
      // TODO: Implement SMS sending
      console.log('Sending SMS:', action.config, context)
      break

    case 'create_task':
      // TODO: Implement task creation
      console.log('Creating task:', action.config, context)
      break

    case 'update_lead_status':
      if (context.leadId && action.config.status) {
        const supabase = createServerClient()
        const { error } = await supabase
          .from('leads')
          .update({ status: action.config.status })
          .eq('id', context.leadId)
        if (error) {
          console.error('Failed to update lead status:', error)
        }
      }
      break

    case 'assign_to_team':
      // TODO: Implement team assignment
      console.log('Assigning to team:', action.config, context)
      break

    case 'add_tag':
      // TODO: Implement tag addition
      console.log('Adding tag:', action.config, context)
      break

    case 'webhook':
      // TODO: Implement webhook call
      console.log('Calling webhook:', action.config, context)
      break

    case 'schedule_followup':
      // TODO: Implement follow-up scheduling
      console.log('Scheduling follow-up:', action.config, context)
      break
  }
}

export async function triggerWorkflows(
  triggerType: string,
  context: WorkflowExecutionContext
) {
  const supabase = createServerClient()

  // Get enabled workflows matching the trigger
  const { data: workflows } = await supabase
    .from('workflows')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('enabled', true)
    .eq('trigger_type', triggerType)

  if (!workflows || workflows.length === 0) {
    return { executed: 0 }
  }

  let executedCount = 0

  for (const workflow of workflows) {
    // Check if trigger conditions are met
    if (shouldExecuteWorkflow(workflow, context)) {
      try {
        // Log execution start
        const { data: execution } = await supabase
          .from('workflow_executions')
          .insert({
            workflow_id: workflow.id,
            organization_id: context.organizationId,
            trigger_event: triggerType,
            trigger_data: context.triggerData || {},
            status: 'running',
            lead_id: context.leadId,
            call_id: context.callId,
            appointment_id: context.appointmentId,
          })
          .select()
          .single()

        // Execute all actions
        for (const action of workflow.actions) {
          await executeWorkflowAction(action, context)
        }

        // Mark execution as completed
        if (execution) {
          await supabase
            .from('workflow_executions')
            .update({ status: 'completed' })
            .eq('id', execution.id)
        }

        // Update workflow stats
        await supabase
          .from('workflows')
          .update({
            execution_count: workflow.execution_count + 1,
            last_executed_at: new Date().toISOString(),
          })
          .eq('id', workflow.id)

        executedCount++
      } catch (error) {
        console.error('Workflow execution error:', error)
        // Log error in execution record
        // (implementation would update the execution record with error)
      }
    }
  }

  return { executed: executedCount }
}

function shouldExecuteWorkflow(workflow: any, context: WorkflowExecutionContext): boolean {
  const config = workflow.trigger_config || {}

  // Check trigger-specific conditions
  switch (workflow.trigger_type) {
    case 'lead_status_changed':
      return config.status === context.triggerData?.newStatus

    case 'lead_score_threshold':
      const score = context.triggerData?.score || 0
      return score >= (config.threshold || 0)

    default:
      return true
  }
}

