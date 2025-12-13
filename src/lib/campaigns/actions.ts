'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================
// CAMPAIGN CRUD ACTIONS
// ============================================

export async function createCampaign(formData: FormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const organizationId = formData.get('organizationId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const scriptType = formData.get('scriptType') as string || 'general'
  const phoneNumberId = formData.get('phoneNumberId') as string || null
  const dailyLimit = parseInt(formData.get('dailyLimit') as string) || 50

  // Validate organizationId is not empty and is a valid UUID
  if (!organizationId || organizationId.trim() === '') {
    return { error: 'Organization ID is required' }
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(organizationId.trim())) {
    return { error: 'Organization ID must be a valid UUID format' }
  }

  // Schedule data
  const enabledDaysJson = formData.get('enabledDays') as string
  const enabledDays = enabledDaysJson ? JSON.parse(enabledDaysJson) : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const startTime = formData.get('startTime') as string || '09:00'
  const endTime = formData.get('endTime') as string || '17:00'
  const timezone = formData.get('timezone') as string || 'America/New_York'

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      organization_id: organizationId.trim(),
      name,
      description: description || null,
      script_type: scriptType,
      phone_number_id: phoneNumberId || null,
      daily_limit: dailyLimit,
      status: 'draft',
      schedule: {
        enabledDays,
        startTime,
        endTime,
        timezone,
      },
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/campaigns')
  return { success: true, campaignId: data.id }
}

export async function updateCampaign(formData: FormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const campaignId = formData.get('campaignId') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const scriptType = formData.get('scriptType') as string
  const phoneNumberId = formData.get('phoneNumberId') as string || null
  const dailyLimit = parseInt(formData.get('dailyLimit') as string) || 50
  const status = formData.get('status') as string

  // Schedule data
  const enabledDaysJson = formData.get('enabledDays') as string
  const enabledDays = enabledDaysJson ? JSON.parse(enabledDaysJson) : undefined
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const timezone = formData.get('timezone') as string

  const updateData: Record<string, unknown> = {
    name,
    description: description || null,
    script_type: scriptType,
    phone_number_id: phoneNumberId || null,
    daily_limit: dailyLimit,
    updated_at: new Date().toISOString(),
  }

  if (status) {
    updateData.status = status
  }

  if (enabledDays) {
    updateData.schedule = {
      enabledDays,
      startTime,
      endTime,
      timezone,
    }
  }

  const { error } = await supabase
    .from('campaigns')
    .update(updateData)
    .eq('id', campaignId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/campaigns')
  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true }
}

export async function deleteCampaign(campaignId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/campaigns')
  return { success: true }
}

export async function updateCampaignStatus(campaignId: string, status: 'draft' | 'active' | 'paused' | 'completed') {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaignId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/campaigns')
  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true }
}

// ============================================
// CONTACT MANAGEMENT ACTIONS
// ============================================

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  if (!phone) return phone
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (!cleaned || cleaned.length < 10) return phone // Return original if invalid
  
  // If 10 digits, add +1
  if (!cleaned.startsWith('+') && cleaned.length === 10) {
    return '+1' + cleaned
  }
  // If 11 digits starting with 1, add +
  if (!cleaned.startsWith('+') && cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned
  }
  // If already has +, return as is
  return cleaned.startsWith('+') ? cleaned : '+' + cleaned
}

export async function addContact(formData: FormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const campaignId = formData.get('campaignId') as string
  const organizationId = formData.get('organizationId') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const businessName = formData.get('businessName') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const notes = formData.get('notes') as string
  const phoneNumberId = formData.get('phoneNumberId') as string || null

  if (!phone) {
    return { error: 'Phone number is required' }
  }

  // Normalize phone number to E.164 format
  const normalizedPhone = normalizePhoneNumber(phone.trim())

  const { error } = await supabase
    .from('campaign_contacts')
    .insert({
      campaign_id: campaignId,
      organization_id: organizationId,
      name: name || null,
      phone: normalizedPhone,
      email: email || null,
      business_name: businessName || null,
      address: address || null,
      city: city || null,
      state: state || null,
      notes: notes || null,
      phone_number_id: phoneNumberId || null,
      status: 'pending',
    })

  if (error) {
    return { error: error.message }
  }

  // Update campaign contact count
  await updateCampaignStats(campaignId)

  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true }
}

export async function importContacts(
  campaignId: string,
  organizationId: string,
  contacts: Array<{
    name?: string
    phone: string
    email?: string
    businessName?: string
    address?: string
    city?: string
    state?: string
    notes?: string
  }>
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Filter out contacts without phone numbers
  const validContacts = contacts.filter(c => c.phone && c.phone.trim())

  if (validContacts.length === 0) {
    return { error: 'No valid contacts to import' }
  }

  // Normalize phone numbers for all contacts
  const contactsToInsert = validContacts.map(c => ({
    campaign_id: campaignId,
    organization_id: organizationId,
    name: c.name || null,
    phone: normalizePhoneNumber(c.phone.trim()),
    email: c.email || null,
    business_name: c.businessName || null,
    address: c.address || null,
    city: c.city || null,
    state: c.state || null,
    notes: c.notes || null,
    status: 'pending' as const,
  }))

  const { error } = await supabase
    .from('campaign_contacts')
    .insert(contactsToInsert)

  if (error) {
    return { error: error.message }
  }

  // Update campaign contact count
  await updateCampaignStats(campaignId)

  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true, imported: validContacts.length }
}

export async function deleteContact(contactId: string, campaignId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Delete contact only if it belongs to the specified campaign
  const { error } = await supabase
    .from('campaign_contacts')
    .delete()
    .eq('id', contactId)
    .eq('campaign_id', campaignId)

  if (error) {
    return { error: error.message }
  }

  // Update campaign contact count
  await updateCampaignStats(campaignId)

  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true }
}

export async function updateContactStatus(
  contactId: string,
  status: string,
  campaignId: string
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('campaign_contacts')
    .update({ status })
    .eq('id', contactId)

  if (error) {
    return { error: error.message }
  }

  // Update campaign stats
  await updateCampaignStats(campaignId)

  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true }
}

export async function updateContactPhoneNumber(
  contactId: string,
  phoneNumberId: string | null,
  campaignId: string
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('campaign_contacts')
    .update({ phone_number_id: phoneNumberId })
    .eq('id', contactId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateCampaignStats(campaignId: string) {
  const supabase = createActionClient()

  // Get contact counts
  const { data: contacts } = await supabase
    .from('campaign_contacts')
    .select('status')
    .eq('campaign_id', campaignId)

  if (!contacts) return

  const total = contacts.length
  const called = contacts.filter(c => 
    ['no_answer', 'voicemail', 'answered', 'interested', 'not_interested', 'callback', 'wrong_number', 'do_not_call'].includes(c.status)
  ).length
  const answered = contacts.filter(c => 
    ['answered', 'interested', 'not_interested', 'callback'].includes(c.status)
  ).length
  const interested = contacts.filter(c => c.status === 'interested').length

  await supabase
    .from('campaigns')
    .update({
      total_contacts: total,
      contacts_called: called,
      contacts_answered: answered,
      contacts_interested: interested,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)
}

// Convert interested contact to inbound lead
export async function convertToLead(contactId: string, campaignId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get contact
  const { data: contact, error: contactError } = await supabase
    .from('campaign_contacts')
    .select('*')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    return { error: 'Contact not found' }
  }

  // Create lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      organization_id: contact.organization_id,
      name: contact.name || contact.business_name,
      phone: contact.phone,
      email: contact.email,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      status: 'interested',
      notes: contact.notes,
      source: 'campaign',
    })
    .select()
    .single()

  if (leadError) {
    return { error: leadError.message }
  }

  // Update contact with lead reference
  await supabase
    .from('campaign_contacts')
    .update({ converted_lead_id: lead.id })
    .eq('id', contactId)

  revalidatePath(`/app/campaigns/${campaignId}`)
  revalidatePath('/app/leads')
  return { success: true, leadId: lead.id }
}

// Make a call for a campaign contact
export async function makeCallForContact(contactId: string, campaignId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get contact with phone_number_id
  const { data: contact, error: contactError } = await supabase
    .from('campaign_contacts')
    .select('*, phone_number_id')
    .eq('id', contactId)
    .eq('campaign_id', campaignId)
    .single()

  if (contactError || !contact) {
    console.error('[makeCallForContact] Contact error:', contactError)
    return { error: 'Contact not found' }
  }

  // Get campaign separately (including schedule and phone_number_id)
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('organization_id, phone_number_id, schedule')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    console.error('[makeCallForContact] Campaign error:', campaignError)
    return { error: 'Campaign not found' }
  }

  const organizationId = campaign.organization_id
  // Priority: contact phone_number_id > campaign phone_number_id > auto-assign (null)
  const phoneNumberId = (contact as any).phone_number_id || campaign.phone_number_id || undefined
  const campaignSchedule = campaign.schedule as { enabledDays?: string[]; startTime?: string; endTime?: string; timezone?: string } | null

  if (!organizationId) {
    return { error: 'Organization not found' }
  }

  console.log('[makeCallForContact] Initiating call:', { 
    contactId, 
    organizationId, 
    phoneNumberId,
    campaignSchedule: campaignSchedule ? {
      enabledDays: campaignSchedule.enabledDays,
      startTime: campaignSchedule.startTime,
      endTime: campaignSchedule.endTime,
      timezone: campaignSchedule.timezone
    } : null
  })

  // Use initiateOutboundCall from agents/actions
  // Manual calls bypass schedule restrictions
  const { initiateOutboundCall } = await import('@/lib/agents/actions')
  const result = await initiateOutboundCall({
    organizationId,
    phoneNumberId: phoneNumberId || undefined,
    campaignContactId: contactId,
    campaignSchedule: campaignSchedule ? {
      enabledDays: campaignSchedule.enabledDays || [],
      startTime: campaignSchedule.startTime || '09:00',
      endTime: campaignSchedule.endTime || '17:00',
      timezone: campaignSchedule.timezone || 'America/New_York',
    } : null,
    skipScheduleCheck: true, // Manual calls override schedule
  })

  if (result.error) {
    console.error('[makeCallForContact] Call initiation error:', result.error)
    return { error: result.error }
  }

  console.log('[makeCallForContact] Call initiated successfully:', result.callId)

  revalidatePath(`/app/campaigns/${campaignId}`)
  return { success: true, callId: result.callId }
}

