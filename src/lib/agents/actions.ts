'use server'

import { createActionClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { autoConfigureWebhook } from '@/lib/vapi/auto-webhook'

const VAPI_API_URL = 'https://api.vapi.ai'

// ============================================
// INBOUND CONFIG ACTIONS
// ============================================

export async function updateInboundConfig(formData: FormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const organizationId = formData.get('organizationId') as string
  const inboundPhoneNumberId = formData.get('inboundPhoneNumberId') as string
  const businessName = formData.get('businessName') as string
  const serviceArea = formData.get('serviceArea') as string
  const inboundGreeting = formData.get('inboundGreeting') as string
  const allowResidential = formData.get('allowResidential') === 'on'
  const allowCommercial = formData.get('allowCommercial') === 'on'
  const autoBookEstimates = formData.get('autoBookEstimates') === 'on'
  const enableInbound = formData.get('enableInbound') === 'on'

  // Check if config exists
  const { data: existing } = await supabase
    .from('agent_configs')
    .select('id, inbound_agent_id')
    .eq('organization_id', organizationId)
    .single()

  const configData = {
    organization_id: organizationId,
    inbound_phone_number_id: inboundPhoneNumberId || null,
    inbound_greeting: inboundGreeting || null,
    // Store custom variables for overriding Vapi agent settings
    custom_business_name: businessName || null,
    custom_service_area: serviceArea || null,
    custom_greeting: inboundGreeting || null,
    inbound_enabled: enableInbound && !!existing?.inbound_agent_id,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase
      .from('agent_configs')
      .update(configData)
      .eq('id', existing.id)
    
    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('agent_configs')
      .insert(configData)
    
    if (error) {
      return { error: error.message }
    }
  }

  // Update organization name if provided
  if (businessName) {
    await supabase
      .from('organizations')
      .update({ name: businessName })
      .eq('id', organizationId)
  }

  revalidatePath('/app/inbound-ai')
  return { success: true }
}

// ============================================
// OUTBOUND CONFIG ACTIONS
// ============================================

export async function updateOutboundConfig(formData: FormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const organizationId = formData.get('organizationId') as string
  const selectedPhoneId = formData.get('selectedPhoneId') as string
  const callScriptType = formData.get('callScriptType') as string
  const dailyCallLimit = Math.min(parseInt(formData.get('dailyCallLimit') as string) || 50, 100)
  const enableOutbound = formData.get('enableOutbound') === 'on'
  const introductionStyle = formData.get('introductionStyle') as string || 'company_name'
  
  // Schedule data
  const enabledDaysJson = formData.get('enabledDays') as string
  const enabledDays = enabledDaysJson ? JSON.parse(enabledDaysJson) : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const startTime = formData.get('startTime') as string || '09:00'
  const endTime = formData.get('endTime') as string || '17:00'
  const timezone = formData.get('timezone') as string || 'America/New_York'

  // Check if config exists
  const { data: existing } = await supabase
    .from('agent_configs')
    .select('id, outbound_agent_id')
    .eq('organization_id', organizationId)
    .single()

  const configData = {
    organization_id: organizationId,
    outbound_script_type: callScriptType,
    outbound_enabled: enableOutbound && !!existing?.outbound_agent_id,
    daily_call_limit: dailyCallLimit,
    schedule: {
      enabledDays,
      startTime,
      endTime,
      timezone,
      selectedPhoneId,
      introductionStyle, // Store introduction style preference
    },
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await supabase
      .from('agent_configs')
      .update(configData)
      .eq('id', existing.id)
    
    if (error) {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('agent_configs')
      .insert(configData)
    
    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/app/outbound-ai')
  return { success: true }
}

// ============================================
// CALL INITIATION & MANAGEMENT
// ============================================

interface InitiateCallParams {
  organizationId: string
  leadId?: string
  phoneNumberId?: string
  campaignContactId?: string
  campaignSchedule?: Schedule | null // Optional campaign schedule to override agent config schedule
  skipScheduleCheck?: boolean // If true, bypass schedule restrictions (for manual calls)
}

export async function initiateOutboundCall({ organizationId, leadId, phoneNumberId, campaignContactId, campaignSchedule, skipScheduleCheck = false }: InitiateCallParams) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Must have either leadId or campaignContactId
  if (!leadId && !campaignContactId) {
    return { error: 'Either leadId or campaignContactId is required' }
  }

  // Get agent config
  const { data: agentConfig, error: configError } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (configError || !agentConfig) {
    return { error: 'Agent not configured' }
  }

  if (!agentConfig.outbound_agent_id) {
    return { error: 'Outbound agent not set up yet' }
  }

  if (!agentConfig.outbound_enabled) {
    return { error: 'Outbound calling is disabled' }
  }

  // Get phone number
  let phoneNumber
  let actualPhoneNumberId: string
  
  if (phoneNumberId) {
    // Use specified phone number
    const { data: phone, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', phoneNumberId)
      .eq('organization_id', organizationId)
      .single()

    if (phoneError || !phone) {
      return { error: 'Phone number not found' }
    }
    phoneNumber = phone
    actualPhoneNumberId = phoneNumberId
  } else {
    // Get first available outbound phone number for this organization
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .in('type', ['outbound', 'both'])
      .limit(1)

    if (phoneError || !phoneNumbers || phoneNumbers.length === 0) {
      return { error: 'No outbound phone number available. Please add a phone number in the admin panel.' }
    }
    phoneNumber = phoneNumbers[0]
    actualPhoneNumberId = phoneNumber.id
  }

  // Verify phone number has provider_phone_id (Vapi phone number ID)
  if (!phoneNumber.provider_phone_id) {
    return { error: 'Phone number is missing Vapi Phone Number ID. Please update the phone number in the admin panel with the correct provider_phone_id from Vapi dashboard.' }
  }

  // Check daily limit for phone number
  const today = new Date().toISOString().split('T')[0]
  if (phoneNumber.last_reset_date !== today) {
    // Reset counter for new day
    await supabase
      .from('phone_numbers')
      .update({ calls_today: 0, last_reset_date: today })
      .eq('id', actualPhoneNumberId)
    phoneNumber.calls_today = 0
  }

  if (phoneNumber.calls_today >= phoneNumber.daily_limit) {
    return { error: 'Daily call limit reached for this phone number' }
  }

  // Get contact info - either from lead or campaign contact
  let contactPhone: string
  let contactName: string | null = null
  let actualLeadId: string | null = leadId || null

  if (campaignContactId) {
    // Get campaign contact info
    const { data: contact, error: contactError } = await supabase
      .from('campaign_contacts')
      .select('*')
      .eq('id', campaignContactId)
      .eq('organization_id', organizationId)
      .single()

    if (contactError || !contact) {
      return { error: 'Campaign contact not found' }
    }

    if (!contact.phone) {
      return { error: 'Contact has no phone number' }
    }

    // Check if contact has already been called 2+ times today
    if (contact.last_call_at) {
      const lastCallDate = new Date(contact.last_call_at).toISOString().split('T')[0]
      if (lastCallDate === today && contact.call_count >= 2) {
        return { error: 'Maximum 2 calls per contact per day reached' }
      }
    }

    contactPhone = contact.phone
    contactName = contact.name || contact.business_name

    // Update contact status to queued
    await supabase
      .from('campaign_contacts')
      .update({ status: 'queued' })
      .eq('id', campaignContactId)
  } else if (leadId) {
    // Check calls to this lead today
    const { data: callLimit } = await supabase
      .from('call_limits')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('lead_id', leadId)
      .eq('last_reset_date', today)
      .single()

    if (callLimit && callLimit.calls_today >= 2) {
      return { error: 'Maximum 2 calls per lead per day reached' }
    }

    // Get lead info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('organization_id', organizationId)
      .single()

    if (leadError || !lead) {
      return { error: 'Lead not found' }
    }

    if (!lead.phone) {
      return { error: 'Lead has no phone number' }
    }

    contactPhone = lead.phone
    contactName = lead.name
  } else {
    return { error: 'Either leadId or campaignContactId is required' }
  }

  // Check schedule - skip if manual call, otherwise use campaign schedule if provided, or agent config schedule
  if (!skipScheduleCheck) {
    const scheduleToCheck = campaignSchedule || agentConfig.schedule
    const scheduleCheck = isWithinSchedule(scheduleToCheck)
    if (!scheduleCheck.allowed) {
      return { error: scheduleCheck.reason }
    }
  }

  // Get organization data for custom variables
  const { data: organization } = await supabase
    .from('organizations')
    .select('name, service_areas, city, state')
    .eq('id', organizationId)
    .single()

  // Build custom variables to override Vapi agent settings
  const customVariables: Record<string, any> = {
    // Use custom business name from config, fallback to organization name
    businessName: agentConfig.custom_business_name || organization?.name || 'Business',
    // Use custom service area from config, fallback to organization service areas
    serviceArea: agentConfig.custom_service_area || 
                 (organization?.service_areas && organization.service_areas.length > 0 
                   ? organization.service_areas.join(', ') 
                   : `${organization?.city || ''} ${organization?.state || ''}`.trim()),
    // Custom greeting if provided
    ...(agentConfig.custom_greeting && { customGreeting: agentConfig.custom_greeting }),
    // Merge any additional custom variables from JSONB field
    ...(agentConfig.custom_variables || {}),
  }

  // Make the call via Vapi
  try {
    // Access environment variable - in Next.js server actions, we need to check if it exists
    const vapiApiKey = process.env.VAPI_API_KEY
    
    if (!vapiApiKey || vapiApiKey.trim() === '') {
      console.error('[initiateOutboundCall] ❌ VAPI_API_KEY is missing or empty')
      console.error('[initiateOutboundCall] Environment check:', {
        hasVapiKey: !!process.env.VAPI_API_KEY,
        vapiKeyLength: process.env.VAPI_API_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV,
      })
      return { 
        error: 'Vapi API key not configured. Please add VAPI_API_KEY to your Vercel environment variables and redeploy.' 
      }
    }

    const response = await fetch(`${VAPI_API_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: agentConfig.outbound_agent_id,
        phoneNumberId: phoneNumber.provider_phone_id,
        customer: {
          number: contactPhone,
          name: contactName || undefined,
        },
        // Pass custom variables to override Vapi agent settings
        variables: customVariables,
        // Pass metadata for webhook
        metadata: {
          organizationId,
          leadId: actualLeadId,
          phoneNumberId: actualPhoneNumberId,
          campaignContactId: campaignContactId || undefined,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Vapi API error:', errorData)
      return { error: 'Failed to initiate call' }
    }

    const callData = await response.json()

    // Log the call
    await supabase.from('calls').insert({
      organization_id: organizationId,
      lead_id: actualLeadId,
      campaign_contact_id: campaignContactId || null,
      direction: 'outbound',
      provider_call_id: callData.id,
      from_number: phoneNumber.phone_number,
      to_number: contactPhone,
      status: 'queued',
      raw_payload: callData,
    })

    // Update phone number call count
    await supabase
      .from('phone_numbers')
      .update({ calls_today: phoneNumber.calls_today + 1 })
      .eq('id', actualPhoneNumberId)

    // Update or create call limit record (only for leads, not campaign contacts)
    if (actualLeadId) {
      const { data: callLimit } = await supabase
        .from('call_limits')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('lead_id', actualLeadId)
        .eq('last_reset_date', today)
        .single()

      if (callLimit) {
        await supabase
          .from('call_limits')
          .update({ 
            calls_today: callLimit.calls_today + 1,
            last_call_at: new Date().toISOString(),
          })
          .eq('id', callLimit.id)
      } else {
        await supabase.from('call_limits').insert({
          organization_id: organizationId,
          lead_id: actualLeadId,
          phone_number_id: actualPhoneNumberId,
          calls_today: 1,
          last_call_at: new Date().toISOString(),
          last_reset_date: today,
        })
      }
    }

    // Update campaign contact call count if applicable
    if (campaignContactId) {
      const { data: contact } = await supabase
        .from('campaign_contacts')
        .select('call_count')
        .eq('id', campaignContactId)
        .single()

      await supabase
        .from('campaign_contacts')
        .update({ 
          call_count: (contact?.call_count || 0) + 1,
          status: 'calling',
        })
        .eq('id', campaignContactId)
    }

    // Update agent config call count
    await supabase
      .from('agent_configs')
      .update({ calls_made_today: (agentConfig.calls_made_today || 0) + 1 })
      .eq('id', agentConfig.id)

    return { success: true, callId: callData.id }
  } catch (error) {
    console.error('Error initiating call:', error)
    return { error: 'Failed to initiate call' }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface Schedule {
  enabledDays: string[]
  startTime: string
  endTime: string
  timezone: string
}

function isWithinSchedule(schedule: Schedule | null): { allowed: boolean; reason?: string } {
  if (!schedule) {
    return { allowed: false, reason: 'No schedule configured' }
  }

  const { enabledDays, startTime, endTime, timezone } = schedule

  // Get current time in the specified timezone
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  
  const parts = formatter.formatToParts(now)
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase()
  const hour = parts.find(p => p.type === 'hour')?.value
  const minute = parts.find(p => p.type === 'minute')?.value
  
  if (!weekday || !hour || !minute) {
    return { allowed: false, reason: 'Could not determine current time' }
  }

  // Check day
  if (!enabledDays.includes(weekday)) {
    return { allowed: false, reason: `Calling not enabled on ${weekday}` }
  }

  // Check time
  const currentTime = `${hour}:${minute}`
  if (currentTime < startTime) {
    return { allowed: false, reason: `Too early - calls start at ${startTime}` }
  }
  if (currentTime > endTime) {
    return { allowed: false, reason: `Too late - calls end at ${endTime}` }
  }

  return { allowed: true }
}

// ============================================
// ADMIN FUNCTIONS (for you to manage clients)
// ============================================

export async function adminSetAgentId(
  organizationId: string,
  agentType: 'inbound' | 'outbound',
  agentId: string
) {
  // Use service role client for admin operations to bypass RLS
  const supabase = createServiceRoleClient()
  
  const { data: existing } = await supabase
    .from('agent_configs')
    .select('id')
    .eq('organization_id', organizationId)
    .single()

  const updateData = agentType === 'inbound' 
    ? { inbound_agent_id: agentId }
    : { outbound_agent_id: agentId }

  if (existing) {
    const { error } = await supabase
      .from('agent_configs')
      .update(updateData)
      .eq('id', existing.id)
    
    if (error) {
      console.error('[Admin] Error updating agent ID:', error)
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('agent_configs')
      .insert({
        organization_id: organizationId,
        ...updateData,
      })
    
    if (error) {
      console.error('[Admin] Error inserting agent ID:', error)
      return { error: error.message }
    }
  }

  // Automatically set webhook URL for the assistant
  // This ensures all assistants use the same webhook endpoint
  // No manual configuration needed - happens automatically!
  const webhookResult = await autoConfigureWebhook(agentId)
  if (!webhookResult.success) {
    console.warn('[Admin] Failed to set webhook URL for assistant:', webhookResult.error)
    // Don't fail the whole operation, just log a warning
    // The webhook can be set manually later if needed
  } else {
    console.log('[Admin] ✅ Webhook URL automatically configured for assistant:', agentId)
  }

  // Automatically enable the agent when ID is set
  if (agentType === 'outbound' && agentId) {
    await supabase
      .from('agent_configs')
      .update({ outbound_enabled: true })
      .eq('organization_id', organizationId)
    console.log('[Admin] ✅ Outbound calling automatically enabled')
  } else if (agentType === 'inbound' && agentId) {
    await supabase
      .from('agent_configs')
      .update({ inbound_enabled: true })
      .eq('organization_id', organizationId)
    console.log('[Admin] ✅ Inbound calling automatically enabled')
  }

  return { success: true }
}

// Normalize phone number to E.164 format for consistent storage
function normalizePhoneNumberForStorage(phone: string): string {
  if (!phone) return phone
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  // If it starts with 1 and has 11 digits, it's already E.164
  // If it has 10 digits, add +1
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  if (digits.length === 10) {
    return `+1${digits}`
  }
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone
  }
  return phone
}

export async function adminAddPhoneNumber(
  organizationId: string,
  phoneNumber: string,
  providerPhoneId: string,
  friendlyName: string,
  type: 'inbound' | 'outbound' | 'both',
  dailyLimit: number = 100
) {
  // Use service role client for admin operations to bypass RLS
  const supabase = createServiceRoleClient()
  
  // Normalize phone number to E.164 format for consistent storage
  const normalizedPhone = normalizePhoneNumberForStorage(phoneNumber)
  console.log('[Admin] Adding phone number:', phoneNumber, '-> normalized:', normalizedPhone)
  
  const { error } = await supabase.from('phone_numbers').insert({
    organization_id: organizationId,
    phone_number: normalizedPhone,
    provider_phone_id: providerPhoneId,
    friendly_name: friendlyName || null,
    type,
    daily_limit: dailyLimit,
    active: true,
  })

  if (error) {
    console.error('[Admin] Error adding phone number:', error)
    return { error: error.message }
  }
  return { success: true }
}

export async function getCallStats(organizationId: string) {
  const supabase = createActionClient()
  const today = new Date().toISOString().split('T')[0]

  // Get agent config
  const { data: agentConfig } = await supabase
    .from('agent_configs')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  // Get phone numbers with their stats
  const { data: phoneNumbers } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('active', true)

  // Get today's calls
  const { data: todaysCalls, count } = await supabase
    .from('calls')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('created_at', `${today}T00:00:00`)
    .eq('direction', 'outbound')

  return {
    agentConfig,
    phoneNumbers,
    todaysCallCount: count || 0,
    dailyLimit: agentConfig?.daily_call_limit || 50,
    callsRemaining: (agentConfig?.daily_call_limit || 50) - (agentConfig?.calls_made_today || 0),
  }
}

