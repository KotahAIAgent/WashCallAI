'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type ActivityType = 
  | 'call_inbound' | 'call_outbound' | 'call_missed' | 'call_voicemail'
  | 'lead_created' | 'lead_updated' | 'lead_status_changed'
  | 'appointment_created' | 'appointment_updated' | 'appointment_cancelled'
  | 'tag_added' | 'tag_removed'
  | 'note_added' | 'email_sent' | 'sms_sent'
  | 'score_updated' | 'converted_from_campaign'

export async function logActivity({
  organizationId,
  leadId,
  campaignContactId,
  type,
  title,
  description,
  metadata,
  actorId,
  actorName,
}: {
  organizationId: string
  leadId?: string
  campaignContactId?: string
  type: ActivityType
  title: string
  description?: string
  metadata?: Record<string, any>
  actorId?: string
  actorName?: string
}) {
  const supabase = createActionClient()

  const { error } = await supabase.from('activity_logs').insert({
    organization_id: organizationId,
    lead_id: leadId || null,
    campaign_contact_id: campaignContactId || null,
    type,
    title,
    description: description || null,
    metadata: metadata || null,
    actor_id: actorId || null,
    actor_name: actorName || null,
  })

  if (error) {
    console.error('Failed to log activity:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function getLeadActivityTimeline(leadId: string) {
  const supabase = createActionClient()

  // Get activity logs
  const { data: activities, error: activitiesError } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (activitiesError) {
    return { error: activitiesError.message }
  }

  // Get calls for this lead
  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  // Get appointments for this lead
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  // Get notes for this lead
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  // Combine all into a unified timeline
  const timeline: Array<{
    id: string
    type: string
    title: string
    description?: string
    metadata?: any
    created_at: string
    actor_name?: string
    data?: any
  }> = []

  // Add activity logs
  activities?.forEach(activity => {
    timeline.push({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata,
      created_at: activity.created_at,
      actor_name: activity.actor_name,
    })
  })

  // Add calls that aren't already in activity logs
  calls?.forEach(call => {
    const callType = call.direction === 'inbound' ? 'call_inbound' : 'call_outbound'
    const exists = timeline.some(t => 
      t.metadata?.call_id === call.id || 
      (t.type === callType && new Date(t.created_at).getTime() === new Date(call.created_at).getTime())
    )
    if (!exists) {
      timeline.push({
        id: call.id,
        type: call.status === 'voicemail' ? 'call_voicemail' : 
              call.status === 'failed' ? 'call_missed' : callType,
        title: call.direction === 'inbound' ? 'Inbound call received' : 'Outbound call made',
        description: call.summary || undefined,
        created_at: call.created_at,
        data: {
          duration: call.duration_seconds,
          status: call.status,
          recording_url: call.recording_url,
        },
      })
    }
  })

  // Add appointments
  appointments?.forEach(apt => {
    const exists = timeline.some(t => t.metadata?.appointment_id === apt.id)
    if (!exists) {
      timeline.push({
        id: apt.id,
        type: 'appointment_created',
        title: apt.title,
        description: apt.notes || undefined,
        created_at: apt.created_at,
        data: {
          start_time: apt.start_time,
          end_time: apt.end_time,
        },
      })
    }
  })

  // Add notes
  notes?.forEach(note => {
    const exists = timeline.some(t => t.metadata?.note_id === note.id)
    if (!exists) {
      timeline.push({
        id: note.id,
        type: 'note_added',
        title: 'Note added',
        description: note.content,
        created_at: note.created_at,
        actor_name: note.author_name || undefined,
        data: {
          pinned: note.pinned,
        },
      })
    }
  })

  // Sort by date descending
  timeline.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { timeline }
}

export async function getOrganizationActivity(organizationId: string, limit: number = 50) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      leads (id, name, phone)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { error: error.message }
  }

  return { activities: data }
}

