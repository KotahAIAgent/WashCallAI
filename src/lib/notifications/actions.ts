'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type NotificationType = 
  | 'new_lead' | 'call_completed' | 'appointment_booked' 
  | 'callback_reminder' | 'dispute_resolved' | 'setup_status' 
  | 'usage_warning' | 'system'

export async function createNotification({
  organizationId,
  userId,
  type,
  title,
  message,
  link,
  leadId,
  callId,
  appointmentId,
}: {
  organizationId: string
  userId?: string
  type: NotificationType
  title: string
  message: string
  link?: string
  leadId?: string
  callId?: string
  appointmentId?: string
}) {
  const supabase = createActionClient()

  const { error } = await supabase.from('notifications').insert({
    organization_id: organizationId,
    user_id: userId || null,
    type,
    title,
    message,
    link: link || null,
    lead_id: leadId || null,
    call_id: callId || null,
    appointment_id: appointmentId || null,
  })

  if (error) {
    console.error('Failed to create notification:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function getNotifications(organizationId: string, userId: string) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('organization_id', organizationId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return { error: error.message }
  }

  return { notifications: data }
}

export async function getUnreadCount(organizationId: string, userId: string) {
  const supabase = createActionClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq('read', false)

  if (error) {
    return { error: error.message }
  }

  return { count: count || 0 }
}

export async function markAsRead(notificationId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('notifications')
    .update({ 
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function markAllAsRead(organizationId: string, userId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('notifications')
    .update({ 
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq('read', false)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true }
}

export async function deleteNotification(notificationId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// Helper to create common notifications
export async function notifyNewLead(organizationId: string, leadName: string, leadId: string) {
  return createNotification({
    organizationId,
    type: 'new_lead',
    title: 'New Lead!',
    message: `${leadName || 'A new lead'} just came in from an inbound call.`,
    link: `/app/leads/${leadId}`,
    leadId,
  })
}

export async function notifyCallCompleted(
  organizationId: string, 
  direction: 'inbound' | 'outbound',
  outcome: string,
  leadName?: string,
  callId?: string
) {
  return createNotification({
    organizationId,
    type: 'call_completed',
    title: `${direction === 'inbound' ? 'Inbound' : 'Outbound'} Call Completed`,
    message: `Call with ${leadName || 'contact'} ended. Outcome: ${outcome}`,
    link: callId ? `/app/calls/${callId}` : '/app/calls',
    callId,
  })
}

export async function notifyAppointmentBooked(
  organizationId: string,
  title: string,
  startTime: string,
  leadId?: string,
  appointmentId?: string
) {
  const date = new Date(startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return createNotification({
    organizationId,
    type: 'appointment_booked',
    title: 'Appointment Booked! 📅',
    message: `${title} scheduled for ${date}`,
    link: '/app/calendar',
    leadId,
    appointmentId,
  })
}

export async function notifyUsageWarning(organizationId: string, usagePercent: number) {
  return createNotification({
    organizationId,
    type: 'usage_warning',
    title: 'Usage Warning ⚠️',
    message: `You've used ${usagePercent}% of your monthly outbound calls. Consider upgrading your plan.`,
    link: '/app/pricing',
  })
}

