'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type TriggerStatus = 'no_answer' | 'voicemail' | 'callback' | 'interested'
type ActionType = 'schedule_call' | 'send_sms' | 'create_task'

export async function getFollowUpRules(organizationId: string) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('follow_up_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { rules: data }
}

export async function createFollowUpRule({
  organizationId,
  name,
  triggerStatus,
  action,
  delayHours,
  maxAttempts,
  onlyDuringBusinessHours,
  messageTemplate,
}: {
  organizationId: string
  name: string
  triggerStatus: TriggerStatus
  action: ActionType
  delayHours?: number
  maxAttempts?: number
  onlyDuringBusinessHours?: boolean
  messageTemplate?: string
}) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('follow_up_rules')
    .insert({
      organization_id: organizationId,
      name,
      trigger_status: triggerStatus,
      action,
      delay_hours: delayHours || 24,
      max_attempts: maxAttempts || 3,
      only_during_business_hours: onlyDuringBusinessHours ?? true,
      message_template: messageTemplate || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/settings')
  return { rule: data }
}

export async function updateFollowUpRule(
  ruleId: string,
  updates: {
    name?: string
    enabled?: boolean
    triggerStatus?: TriggerStatus
    action?: ActionType
    delayHours?: number
    maxAttempts?: number
    onlyDuringBusinessHours?: boolean
    messageTemplate?: string
  }
) {
  const supabase = createActionClient()

  const updateData: any = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled
  if (updates.triggerStatus !== undefined) updateData.trigger_status = updates.triggerStatus
  if (updates.action !== undefined) updateData.action = updates.action
  if (updates.delayHours !== undefined) updateData.delay_hours = updates.delayHours
  if (updates.maxAttempts !== undefined) updateData.max_attempts = updates.maxAttempts
  if (updates.onlyDuringBusinessHours !== undefined) updateData.only_during_business_hours = updates.onlyDuringBusinessHours
  if (updates.messageTemplate !== undefined) updateData.message_template = updates.messageTemplate

  const { error } = await supabase
    .from('follow_up_rules')
    .update(updateData)
    .eq('id', ruleId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/settings')
  return { success: true }
}

export async function deleteFollowUpRule(ruleId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('follow_up_rules')
    .delete()
    .eq('id', ruleId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/settings')
  return { success: true }
}

export async function scheduleFollowUp({
  organizationId,
  ruleId,
  leadId,
  campaignContactId,
  scheduledFor,
  action,
  attemptNumber,
}: {
  organizationId: string
  ruleId?: string
  leadId?: string
  campaignContactId?: string
  scheduledFor: Date
  action: ActionType
  attemptNumber?: number
}) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('scheduled_follow_ups')
    .insert({
      organization_id: organizationId,
      rule_id: ruleId || null,
      lead_id: leadId || null,
      campaign_contact_id: campaignContactId || null,
      scheduled_for: scheduledFor.toISOString(),
      action,
      attempt_number: attemptNumber || 1,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { followUp: data }
}

export async function getScheduledFollowUps(organizationId: string, status?: string) {
  const supabase = createActionClient()

  let query = supabase
    .from('scheduled_follow_ups')
    .select(`
      *,
      leads (id, name, phone),
      campaign_contacts (id, name, phone),
      follow_up_rules (id, name)
    `)
    .eq('organization_id', organizationId)
    .order('scheduled_for', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message }
  }

  return { followUps: data }
}

export async function cancelFollowUp(followUpId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('scheduled_follow_ups')
    .update({
      status: 'cancelled',
    })
    .eq('id', followUpId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function executeFollowUp(followUpId: string, result: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('scheduled_follow_ups')
    .update({
      status: 'completed',
      executed_at: new Date().toISOString(),
      result,
    })
    .eq('id', followUpId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// Process follow-up rules when a call outcome is determined
export async function processFollowUpRules(
  organizationId: string,
  callOutcome: TriggerStatus,
  leadId?: string,
  campaignContactId?: string,
  currentAttempt?: number
) {
  const supabase = createActionClient()

  // Get matching enabled rules
  const { data: rules } = await supabase
    .from('follow_up_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('trigger_status', callOutcome)
    .eq('enabled', true)

  if (!rules || rules.length === 0) {
    return { scheduled: 0 }
  }

  let scheduledCount = 0

  for (const rule of rules) {
    const attemptNumber = (currentAttempt || 0) + 1

    // Check if we've exceeded max attempts
    if (attemptNumber > rule.max_attempts) {
      continue
    }

    // Calculate scheduled time
    const scheduledFor = new Date()
    scheduledFor.setHours(scheduledFor.getHours() + rule.delay_hours)

    // If only during business hours, adjust time
    if (rule.only_during_business_hours) {
      const hour = scheduledFor.getHours()
      if (hour < 9) {
        scheduledFor.setHours(9, 0, 0, 0)
      } else if (hour >= 17) {
        scheduledFor.setDate(scheduledFor.getDate() + 1)
        scheduledFor.setHours(9, 0, 0, 0)
      }
      // Skip weekends
      const day = scheduledFor.getDay()
      if (day === 0) scheduledFor.setDate(scheduledFor.getDate() + 1)
      if (day === 6) scheduledFor.setDate(scheduledFor.getDate() + 2)
    }

    const result = await scheduleFollowUp({
      organizationId,
      ruleId: rule.id,
      leadId,
      campaignContactId,
      scheduledFor,
      action: rule.action,
      attemptNumber,
    })

    if (!result.error) {
      scheduledCount++
    }
  }

  return { scheduled: scheduledCount }
}

