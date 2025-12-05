'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Default tag colors
const TAG_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

export async function getTags(organizationId: string) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name')

  if (error) {
    return { error: error.message }
  }

  return { tags: data }
}

export async function createTag(organizationId: string, name: string, color?: string) {
  const supabase = createActionClient()

  // Get existing tags count to determine color
  const { data: existingTags } = await supabase
    .from('tags')
    .select('id')
    .eq('organization_id', organizationId)

  const colorIndex = (existingTags?.length || 0) % TAG_COLORS.length
  const tagColor = color || TAG_COLORS[colorIndex]

  const { data, error } = await supabase
    .from('tags')
    .insert({
      organization_id: organizationId,
      name: name.trim(),
      color: tagColor,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A tag with this name already exists' }
    }
    return { error: error.message }
  }

  revalidatePath('/app/leads')
  return { tag: data }
}

export async function updateTag(tagId: string, updates: { name?: string; color?: string }) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', tagId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/leads')
  return { success: true }
}

export async function deleteTag(tagId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/leads')
  return { success: true }
}

export async function addTagToLead(leadId: string, tagId: string) {
  const supabase = createActionClient()

  const { error } = await supabase
    .from('lead_tags')
    .insert({
      lead_id: leadId,
      tag_id: tagId,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Tag already added to this lead' }
    }
    return { error: error.message }
  }

  // Log activity
  const { data: lead } = await supabase
    .from('leads')
    .select('organization_id')
    .eq('id', leadId)
    .single()

  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('id', tagId)
    .single()

  if (lead && tag) {
    await supabase.from('activity_logs').insert({
      organization_id: lead.organization_id,
      lead_id: leadId,
      type: 'tag_added',
      title: `Tag added: ${tag.name}`,
      description: `Added tag "${tag.name}" to lead`,
    })
  }

  revalidatePath('/app/leads')
  return { success: true }
}

export async function removeTagFromLead(leadId: string, tagId: string) {
  const supabase = createActionClient()

  // Get tag name before deleting for activity log
  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('id', tagId)
    .single()

  const { error } = await supabase
    .from('lead_tags')
    .delete()
    .eq('lead_id', leadId)
    .eq('tag_id', tagId)

  if (error) {
    return { error: error.message }
  }

  // Log activity
  const { data: lead } = await supabase
    .from('leads')
    .select('organization_id')
    .eq('id', leadId)
    .single()

  if (lead && tag) {
    await supabase.from('activity_logs').insert({
      organization_id: lead.organization_id,
      lead_id: leadId,
      type: 'tag_removed',
      title: `Tag removed: ${tag.name}`,
      description: `Removed tag "${tag.name}" from lead`,
    })
  }

  revalidatePath('/app/leads')
  return { success: true }
}

export async function getLeadTags(leadId: string) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('lead_tags')
    .select(`
      id,
      tags (
        id,
        name,
        color
      )
    `)
    .eq('lead_id', leadId)

  if (error) {
    return { error: error.message }
  }

  const tags = data?.map(lt => (lt.tags as any)).filter(Boolean) || []
  return { tags }
}

export async function getLeadsWithTag(organizationId: string, tagId: string) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('lead_tags')
    .select(`
      leads (*)
    `)
    .eq('tag_id', tagId)

  if (error) {
    return { error: error.message }
  }

  const leads = data?.map(lt => (lt.leads as any)).filter(Boolean) || []
  return { leads }
}

