'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity/actions'

export async function getNotes(leadId: string) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { notes: data }
}

export async function createNote({
  organizationId,
  leadId,
  campaignContactId,
  content,
  authorId,
  authorName,
}: {
  organizationId: string
  leadId?: string
  campaignContactId?: string
  content: string
  authorId?: string
  authorName?: string
}) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('notes')
    .insert({
      organization_id: organizationId,
      lead_id: leadId || null,
      campaign_contact_id: campaignContactId || null,
      content,
      author_id: authorId || null,
      author_name: authorName || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Log activity
  if (leadId) {
    await logActivity({
      organizationId,
      leadId,
      type: 'note_added',
      title: 'Note added',
      description: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      metadata: { note_id: data.id },
      actorId: authorId,
      actorName: authorName,
    })
  }

  revalidatePath('/app/leads')
  return { note: data }
}

export async function updateNote(noteId: string, content: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('notes')
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/leads')
  return { success: true }
}

export async function deleteNote(noteId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/leads')
  return { success: true }
}

export async function togglePinNote(noteId: string, pinned: boolean) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('notes')
    .update({ pinned })
    .eq('id', noteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/leads')
  return { success: true }
}

