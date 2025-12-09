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
  leadId: string
  phoneNumberId: string
}

export async function initiateOutboundCall({ organizationId, leadId, phoneNumberId }: InitiateCallParams) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
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
  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('id', phoneNumberId)
    .eq('organization_id', organizationId)
    .single()

  if (phoneError || !phoneNumber) {
    return { error: 'Phone number not found' }
  }

  // Check daily limit for phone number
  const today = new Date().toISOString().split('T')[0]
  if (phoneNumber.last_reset_date !== today) {
    // Reset counter for new day
    await supabase
      .from('phone_numbers')
      .update({ calls_today: 0, last_reset_date: today })
      .eq('id', phoneNumberId)
    phoneNumber.calls_today = 0
  }

  if (phoneNumber.calls_today >= phoneNumber.daily_limit) {
    return { error: 'Daily call limit reached for this phone number' }
  }

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

  // Check schedule
  const scheduleCheck = isWithinSchedule(agentConfig.schedule)
  if (!scheduleCheck.allowed) {
    return { error: scheduleCheck.reason }
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
    const vapiApiKey = process.env.VAPI_API_KEY
    if (!vapiApiKey) {
      return { error: 'Vapi API key not configured' }
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
          number: lead.phone,
          name: lead.name || undefined,
        },
        // Pass custom variables to override Vapi agent settings
        variables: customVariables,
        // Pass metadata for webhook
        metadata: {
          organizationId,
          leadId,
          phoneNumberId,
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
      lead_id: leadId,
      direction: 'outbound',
      provider_call_id: callData.id,
      from_number: phoneNumber.phone_number,
      to_number: lead.phone,
      status: 'queued',
      raw_payload: callData,
    })

    // Update phone number call count
    await supabase
      .from('phone_numbers')
      .update({ calls_today: phoneNumber.calls_today + 1 })
      .eq('id', phoneNumberId)

    // Update or create call limit record
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
        lead_id: leadId,
        phone_number_id: phoneNumberId,
        calls_today: 1,
        last_call_at: new Date().toISOString(),
        last_reset_date: today,
      })
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

