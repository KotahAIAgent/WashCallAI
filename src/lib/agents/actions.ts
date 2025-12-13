'use server'

import { createActionClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { autoConfigureWebhook } from '@/lib/vapi/auto-webhook'
import { planHasAccess } from '@/lib/stripe/server'
import { getEffectivePlan } from '@/lib/admin/utils'

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

  // Handle greeting: empty string means use default (set to null), otherwise use the custom greeting
  const greetingValue = inboundGreeting?.trim() || null

  const configData = {
    organization_id: organizationId,
    inbound_phone_number_id: inboundPhoneNumberId || null,
    inbound_greeting: greetingValue,
    // Store custom variables for overriding Vapi agent settings
    custom_business_name: businessName || null,
    custom_service_area: serviceArea || null,
    custom_greeting: greetingValue,
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

  // Update Vapi assistant with custom greeting (if assistant exists)
  const vapiApiKey = process.env.VAPI_API_KEY
  const assistantId = existing?.inbound_agent_id

  if (vapiApiKey && assistantId) {
    // Validate assistant ID is not organization ID
    if (assistantId === organizationId) {
      console.warn(`[updateInboundConfig] ⚠️ Assistant ID matches organization ID, skipping Vapi update`)
    } else {
      try {
        const updatePayload: any = {}
        
        // If greeting is provided, set it. If null/empty, clear it to use Vapi default
        if (greetingValue) {
          updatePayload.firstMessage = greetingValue
          console.log(`[updateInboundConfig] Setting custom greeting: ${greetingValue.substring(0, 50)}...`)
        } else {
          // If greeting is disabled, try to clear it by setting to null
          // Vapi may use the default from the model/system prompt if firstMessage is null
          updatePayload.firstMessage = null
          console.log(`[updateInboundConfig] Custom greeting disabled, clearing to use Vapi default`)
        }

        const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[updateInboundConfig] ❌ Failed to update Vapi assistant greeting:`, {
            status: response.status,
            error: errorText,
            assistantId,
            greetingValue: greetingValue ? 'custom' : 'default',
          })
          // Don't fail the whole operation - greeting is saved in DB
        } else {
          const responseData = await response.json().catch(() => ({}))
          console.log(`[updateInboundConfig] ✅ Greeting updated for inbound assistant:`, {
            assistantId,
            usingCustom: !!greetingValue,
            greeting: greetingValue ? greetingValue.substring(0, 50) + '...' : 'Vapi default',
          })
        }
      } catch (err: any) {
        console.error(`[updateInboundConfig] ❌ Error updating Vapi assistant greeting:`, err?.message || err)
        // Don't fail - greeting is saved in DB
      }
    }
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

  // Check if organization has access to outbound calling based on plan
  const { data: org } = await supabase
    .from('organizations')
    .select('plan, admin_granted_plan, admin_granted_plan_expires_at, admin_privileges')
    .eq('id', organizationId)
    .maybeSingle()

  if (!org) {
    return { error: 'Organization not found' }
  }

  // Get effective plan (considers admin-granted plans)
  const effectivePlan = getEffectivePlan({
    plan: org.plan as 'starter' | 'growth' | 'pro' | null,
    admin_granted_plan: org.admin_granted_plan as 'starter' | 'growth' | 'pro' | null,
    admin_granted_plan_expires_at: org.admin_granted_plan_expires_at,
  })

  // Check if plan has outbound access
  if (!planHasAccess(effectivePlan, 'outbound')) {
    return { 
      error: 'Outbound calling is not available on your current plan. Please upgrade to Growth or Pro plan to access outbound calling features.' 
    }
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

  // Get contact info first to determine phone number assignment
  let contactPhone: string
  let contactName: string | null = null
  let actualLeadId: string | null = leadId || null
  let campaignData: { script_type?: string; description?: string; name?: string } | null = null
  let resolvedPhoneNumberId: string | undefined = phoneNumberId

  if (campaignContactId) {
    // Get campaign contact info with campaign data and phone_number_id
    const { data: contact, error: contactError } = await supabase
      .from('campaign_contacts')
      .select('*, campaigns(script_type, description, name, phone_number_id)')
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
    const today = new Date().toISOString().split('T')[0]
    if (contact.last_call_at) {
      const lastCallDate = new Date(contact.last_call_at).toISOString().split('T')[0]
      if (lastCallDate === today && contact.call_count >= 2) {
        return { error: 'Maximum 2 calls per contact per day reached' }
      }
    }

    // Determine phone number to use: contact phone_number_id > campaign phone_number_id > use phoneNumberId param
    const campaign = (contact as any).campaigns
    const contactPhoneNumberId = (contact as any).phone_number_id
    const campaignPhoneNumberId = campaign?.phone_number_id
    
    // Priority: contact phone_number_id > campaign phone_number_id > phoneNumberId param
    if (contactPhoneNumberId) {
      resolvedPhoneNumberId = contactPhoneNumberId
    } else if (campaignPhoneNumberId) {
      resolvedPhoneNumberId = campaignPhoneNumberId
    }

    contactPhone = normalizePhoneNumberForStorage(contact.phone)
    contactName = contact.name || contact.business_name

    // Extract campaign data for dynamic prompts
    if (campaign) {
      campaignData = {
        script_type: campaign.script_type,
        description: campaign.description,
        name: campaign.name,
      }
    }

    // Update contact status to queued
    await supabase
      .from('campaign_contacts')
      .update({ status: 'queued' })
      .eq('id', campaignContactId)
  } else if (leadId) {
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

    contactPhone = normalizePhoneNumberForStorage(lead.phone)
    contactName = lead.name
  } else {
    return { error: 'Either leadId or campaignContactId is required' }
  }

  // Get phone number using resolved phone number ID
  let phoneNumber
  let actualPhoneNumberId: string
  
  if (resolvedPhoneNumberId) {
    // Use specified phone number (from contact, campaign, or param)
    const { data: phone, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', resolvedPhoneNumberId)
      .eq('organization_id', organizationId)
      .single()

    if (phoneError || !phone) {
      return { error: 'Phone number not found' }
    }
    phoneNumber = phone
    actualPhoneNumberId = resolvedPhoneNumberId
  } else {
    // Auto-assign: Get first available outbound phone number for this organization
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .in('type', ['outbound', 'both'])
      .order('created_at', { ascending: true })
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

  // Verify provider_phone_id is a valid UUID format (Vapi phone number IDs are UUIDs)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(phoneNumber.provider_phone_id)) {
    return { error: 'Phone number has invalid Vapi Phone Number ID format. The provider_phone_id must be a UUID. Please update it in the admin panel with the correct UUID from Vapi dashboard (Phone Numbers → Copy ID).' }
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

  // Check call limits for leads (campaign contacts are checked above)
  if (leadId) {
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

  // Generate campaign-specific prompt context if campaign data is available
  let campaignPromptContext: Record<string, any> = {}
  if (campaignData) {
    campaignPromptContext = generateCampaignPromptContext(campaignData.script_type, campaignData.description, campaignData.name)
  }

  // Validate phone number format (must be E.164)
  if (!contactPhone || !contactPhone.startsWith('+')) {
    return { error: `Invalid phone number format. Phone number must be in E.164 format (e.g., +1234567890). Got: ${contactPhone}` }
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

    // Build request body - only include fields that Vapi API accepts
    const requestBody: any = {
      assistantId: agentConfig.outbound_agent_id,
      phoneNumberId: phoneNumber.provider_phone_id, // Must be Vapi's phone number ID (not our UUID)
      customer: {
        number: contactPhone,
        name: contactName || undefined,
      },
      // Pass metadata for webhook (this is allowed)
      metadata: {
        organizationId,
        leadId: actualLeadId,
        phoneNumberId: actualPhoneNumberId, // Our internal UUID for tracking
        campaignContactId: campaignContactId || undefined,
      },
    }

    console.log('[initiateOutboundCall] Making Vapi API call:', {
      url: `${VAPI_API_URL}/call/phone`,
      assistantId: agentConfig.outbound_agent_id,
      phoneNumberId: phoneNumber.provider_phone_id,
      customerNumber: contactPhone,
      hasApiKey: !!vapiApiKey,
    })

    const response = await fetch(`${VAPI_API_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to initiate call'
      try {
        const errorData = await response.json()
        console.error('[initiateOutboundCall] Vapi API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestBody: {
            assistantId: requestBody.assistantId,
            phoneNumberId: requestBody.phoneNumberId,
            customerNumber: requestBody.customer?.number,
          },
        })
        // Extract meaningful error message from Vapi response
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error)
        } else if (errorData.details) {
          errorMessage = errorData.details
        }
        
        // Provide more specific error messages for common issues
        if (errorMessage.toLowerCase().includes('notfound') || errorMessage.toLowerCase().includes('not found')) {
          if (errorMessage.toLowerCase().includes('phone') || errorMessage.toLowerCase().includes('number')) {
            errorMessage = `Phone number not found in Vapi. Please verify the provider_phone_id (${phoneNumber.provider_phone_id}) is correct in the admin panel.`
          } else if (errorMessage.toLowerCase().includes('assistant')) {
            errorMessage = `Assistant not found in Vapi. Please verify the outbound_agent_id (${agentConfig.outbound_agent_id}) is correct.`
          } else {
            errorMessage = `Resource not found in Vapi. Please verify your phone number ID (${phoneNumber.provider_phone_id}) and assistant ID (${agentConfig.outbound_agent_id}) are correct.`
          }
        }
      } catch (parseError) {
        const errorText = await response.text()
        console.error('[initiateOutboundCall] Failed to parse error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        errorMessage = `Vapi API error: ${response.status} ${response.statusText}`
        if (response.status === 404) {
          errorMessage = `Resource not found (404). Please verify your phone number ID and assistant ID are correct in Vapi.`
        }
      }
      return { error: errorMessage }
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

/**
 * Generate campaign-specific prompt context based on script type and description
 * This creates dynamic variables that can be used in Vapi assistant prompts
 */
function generateCampaignPromptContext(
  scriptType?: string,
  description?: string,
  campaignName?: string
): Record<string, string> {
  const context: Record<string, string> = {}

  // Map script types to industry-specific contexts
  const scriptTypeMap: Record<string, { industry: string; services: string; context: string }> = {
    cold_restaurants: {
      industry: 'restaurants',
      services: 'pressure washing, deep cleaning, kitchen exhaust cleaning, and exterior maintenance',
      context: 'You are calling restaurants to offer professional cleaning services. Focus on how clean exteriors and kitchen exhaust systems improve customer perception and health code compliance. Restaurants need regular deep cleaning to maintain hygiene standards.',
    },
    property_managers: {
      industry: 'property management',
      services: 'pressure washing, building maintenance, common area cleaning, and exterior cleaning',
      context: 'You are calling property managers to offer building maintenance and cleaning services. Property managers are responsible for maintaining multiple properties and need reliable, professional cleaning services to keep their properties attractive and well-maintained.',
    },
    past_customers: {
      industry: 'returning customers',
      services: 'follow-up cleaning services, maintenance programs, and additional services',
      context: 'You are calling past customers who have used our services before. They already know our quality and service. Focus on offering maintenance programs, additional services, or scheduling their next cleaning appointment.',
    },
    new_leads: {
      industry: 'new prospects',
      services: 'pressure washing, cleaning services, and maintenance programs',
      context: 'You are calling new leads who have expressed interest or been referred. They may not be familiar with our services yet. Focus on introducing our services, explaining the benefits, and understanding their specific cleaning needs.',
    },
    estimate_reminder: {
      industry: 'estimate follow-up',
      services: 'pressure washing and cleaning services',
      context: 'You are calling to follow up on a previous estimate or quote. The prospect has already shown interest. Focus on answering any questions they may have, addressing concerns, and helping them move forward with scheduling service.',
    },
    general: {
      industry: 'general commercial',
      services: 'pressure washing, cleaning services, and maintenance',
      context: 'You are calling businesses to offer professional cleaning and pressure washing services. Focus on understanding their specific needs and explaining how our services can help maintain their property and improve its appearance.',
    },
  }

  // Get base context from script type
  const baseContext = scriptTypeMap[scriptType || 'general'] || scriptTypeMap.general
  context.industry = baseContext.industry
  context.services = baseContext.services
  context.campaignContext = baseContext.context

  // Add custom description if provided
  if (description) {
    context.campaignDescription = description
    // Enhance context with description
    context.campaignContext = `${baseContext.context} Campaign Details: ${description}`
  }

  // Add campaign name if provided
  if (campaignName) {
    context.campaignName = campaignName
  }

  // Create a comprehensive prompt that combines everything
  context.dynamicPrompt = `You are making a call for a ${baseContext.industry} campaign. ${baseContext.context}${description ? ` Additional campaign details: ${description}` : ''} Focus on discussing ${baseContext.services}. Be professional, friendly, and focus on understanding their needs and how we can help.`

  return context
}

// ============================================
// CLIENT SELF-SERVICE FUNCTIONS
// ============================================

/**
 * Client-facing function to set their own Vapi Assistant ID
 * Validates that the user belongs to the organization
 */
export async function setAgentId(
  agentType: 'inbound' | 'outbound',
  agentId: string
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'Organization not found' }
  }

  const organizationId = profile.organization_id

  // Check if user belongs to this organization (RLS will handle this)
  const { data: existing } = await supabase
    .from('agent_configs')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle()

  const updateData = agentType === 'inbound' 
    ? { inbound_agent_id: agentId }
    : { outbound_agent_id: agentId }

  if (existing) {
    const { error } = await supabase
      .from('agent_configs')
      .update(updateData)
      .eq('id', existing.id)
      .eq('organization_id', organizationId) // Extra safety check
    
    if (error) {
      console.error('[Client] Error updating agent ID:', error)
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
      console.error('[Client] Error inserting agent ID:', error)
      return { error: error.message }
    }
  }

  // Automatically set webhook URL for the assistant
  const webhookResult = await autoConfigureWebhook(agentId)
  if (!webhookResult.success) {
    console.warn('[Client] Failed to set webhook URL for assistant:', webhookResult.error)
  } else {
    console.log('[Client] ✅ Webhook URL automatically configured for assistant:', agentId)
  }

  // Automatically enable the agent when ID is set
  if (agentType === 'outbound' && agentId) {
    await supabase
      .from('agent_configs')
      .update({ outbound_enabled: true })
      .eq('organization_id', organizationId)
    console.log('[Client] ✅ Outbound calling automatically enabled')
  } else if (agentType === 'inbound' && agentId) {
    await supabase
      .from('agent_configs')
      .update({ inbound_enabled: true })
      .eq('organization_id', organizationId)
    console.log('[Client] ✅ Inbound calling automatically enabled')
  }

  // Auto-set setup_status to 'active' if they have a plan
  const { data: org } = await supabase
    .from('organizations')
    .select('plan, admin_granted_plan, setup_status')
    .eq('id', organizationId)
    .single()

  if (org && (org.plan || org.admin_granted_plan) && org.setup_status !== 'active') {
    await supabase
      .from('organizations')
      .update({ setup_status: 'active' })
      .eq('id', organizationId)
    console.log('[Client] ✅ Setup status auto-set to active')
  }

  revalidatePath('/app/inbound-ai')
  revalidatePath('/app/outbound-ai')
  return { success: true }
}

/**
 * Update voice settings for an agent
 * Automatically applies to Vapi assistant
 */
export async function updateVoiceSettings(
  organizationId: string,
  agentType: 'inbound' | 'outbound',
  voiceId: string,
  voiceName: string
) {
  console.log(`[updateVoiceSettings] 🎯 FUNCTION CALLED with:`, {
    organizationId,
    agentType,
    voiceId,
    voiceName,
    timestamp: new Date().toISOString(),
  })

  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.error(`[updateVoiceSettings] ❌ No session found`)
    return { error: 'Not authenticated' }
  }

  console.log(`[updateVoiceSettings] ✅ Session found for user: ${session.user.id}`)

  // Verify user belongs to organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.organization_id !== organizationId) {
    return { error: 'Not authorized' }
  }

  // Update voice settings in agent_configs
  const { data: config } = await supabase
    .from('agent_configs')
    .select('id, inbound_agent_id, outbound_agent_id')
    .eq('organization_id', organizationId)
    .maybeSingle()

  if (!config) {
    return { error: 'Agent configuration not found' }
  }

  const updateData: any = {
    voice_provider: 'elevenlabs',
    voice_id: voiceId,
    voice_name: voiceName,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('agent_configs')
    .update(updateData)
    .eq('id', config.id)

  if (error) {
    return { error: error.message }
  }

  // Update Vapi assistant with new voice
  const vapiApiKey = process.env.VAPI_API_KEY
  const assistantId = agentType === 'inbound' ? config.inbound_agent_id : config.outbound_agent_id

  console.log(`[updateVoiceSettings] Attempting to update ${agentType} voice:`, {
    organizationId,
    assistantId,
    voiceId,
    voiceName,
    hasVapiKey: !!vapiApiKey,
  })

  // Validate assistant ID - check if it's accidentally set to organization ID
  if (assistantId === organizationId) {
    console.error(`[updateVoiceSettings] ❌ CRITICAL: Assistant ID is set to organization ID!`, {
      assistantId,
      organizationId,
      message: 'The assistant_id in the database matches the organization_id. This is incorrect. The assistant_id should be the Vapi Assistant ID from the Vapi dashboard.',
    })
    // Still save to DB, but return a warning
    return { 
      error: `Invalid Assistant ID: The assistant ID is set to your organization ID instead of your Vapi Assistant ID. Please update it in the admin panel with the correct Assistant ID from your Vapi dashboard.`,
      warning: true 
    }
  }

  if (vapiApiKey && assistantId) {
    try {
      const updatePayload = {
        voice: {
          provider: '11labs',
          voiceId: voiceId,
        },
      }
      
      console.log(`[updateVoiceSettings] Sending to Vapi API:`, {
        url: `https://api.vapi.ai/assistant/${assistantId}`,
        payload: updatePayload,
      })

      const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorText
        } catch {
          // Keep original error text
        }
        
        console.error(`[updateVoiceSettings] ❌ Failed to update Vapi assistant voice:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          assistantId,
          voiceId,
          voiceName,
        })
        
        // If 404, provide helpful error message
        if (response.status === 404) {
          return {
            error: `Assistant not found in Vapi. The assistant ID "${assistantId}" does not exist in your Vapi account. Please update the assistant ID in the admin panel with the correct Assistant ID from your Vapi dashboard (https://dashboard.vapi.ai).`,
            warning: true,
          }
        }
        
        // Don't fail the whole operation - voice is saved in DB
      } else {
        const responseData = await response.json().catch(() => ({}))
        console.log(`[updateVoiceSettings] ✅ Voice updated for ${agentType} assistant:`, {
          assistantId,
          voiceId,
          voiceName,
          response: responseData,
        })
      }
    } catch (err: any) {
      console.error(`[updateVoiceSettings] ❌ Error updating Vapi assistant voice:`, {
        error: err?.message || err,
        assistantId,
        voiceId,
        voiceName,
      })
      // Don't fail - voice is saved in DB
    }
  } else {
    if (!vapiApiKey) {
      console.warn(`[updateVoiceSettings] ⚠️ VAPI_API_KEY not configured`)
    }
    if (!assistantId) {
      console.warn(`[updateVoiceSettings] ⚠️ ${agentType}_agent_id not found for organization ${organizationId}`)
    }
  }

  revalidatePath('/app/inbound-ai')
  revalidatePath('/app/outbound-ai')
  return { success: true }
}

/**
 * Submit a prompt change request
 */
export async function submitPromptChangeRequest({
  organizationId,
  agentType,
  requestedChanges,
  reason,
  priority,
}: {
  organizationId: string
  agentType: 'inbound' | 'outbound' | 'both'
  requestedChanges: string
  reason: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
}) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Verify user belongs to organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.organization_id !== organizationId) {
    return { error: 'Not authorized' }
  }

  // Get current prompt if available
  const { data: config } = await supabase
    .from('agent_configs')
    .select('inbound_greeting')
    .eq('organization_id', organizationId)
    .maybeSingle()

  // Insert request
  const { error } = await supabase
    .from('prompt_change_requests')
    .insert({
      organization_id: organizationId,
      user_id: session.user.id,
      agent_type: agentType,
      current_prompt: config?.inbound_greeting || null,
      requested_changes: requestedChanges,
      reason: reason,
      priority,
      status: 'pending',
    })

  if (error) {
    console.error('Error submitting prompt change request:', error)
    return { error: error.message }
  }

  // Send email notification to admin (optional)
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'support@fusioncaller.com'
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'FusionCaller <notifications@fusioncaller.com>',
          to: adminEmail,
          subject: `📝 Prompt Change Request: ${agentType} agent - ${priority} priority`,
          html: `
            <h2>New Prompt Change Request</h2>
            <p><strong>Agent Type:</strong> ${agentType}</p>
            <p><strong>Priority:</strong> ${priority}</p>
            <p><strong>Requested Changes:</strong></p>
            <p>${requestedChanges.replace(/\n/g, '<br>')}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason.replace(/\n/g, '<br>')}</p>` : ''}
            <hr>
            <p><strong>Requested by:</strong> ${session.user.email}</p>
            <p><strong>Organization:</strong> ${org?.name || 'Unknown'}</p>
          `,
        }),
      })
    }
  } catch (emailError) {
    console.error('Error sending prompt change request email:', emailError)
    // Don't fail the request if email fails
  }

  revalidatePath('/app/inbound-ai')
  revalidatePath('/app/outbound-ai')
  return { success: true }
}

/**
 * Client-facing function to add their own phone number
 * Validates that the user belongs to the organization
 */
export async function addPhoneNumber(
  phoneNumber: string,
  providerPhoneId: string,
  friendlyName: string,
  type: 'inbound' | 'outbound' | 'both',
  dailyLimit?: number
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'Organization not found' }
  }

  const organizationId = profile.organization_id

  // Default to 20 for outbound/both, 100 for inbound-only
  const defaultLimit = type === 'inbound' ? 100 : 20
  const finalDailyLimit = dailyLimit ?? defaultLimit
  
  // Validate UUID format for provider_phone_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(providerPhoneId.trim())) {
    return { error: 'Vapi Phone Number ID must be a UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)' }
  }
  
  // Normalize phone number to E.164 format
  const normalizedPhone = normalizePhoneNumberForStorage(phoneNumber)
  
  const { error } = await supabase.from('phone_numbers').insert({
    organization_id: organizationId,
    phone_number: normalizedPhone,
    provider_phone_id: providerPhoneId.trim(),
    friendly_name: friendlyName || null,
    type,
    daily_limit: finalDailyLimit,
    active: true,
  })

  if (error) {
    console.error('[Client] Error adding phone number:', error)
    return { error: error.message }
  }

  // Auto-configure webhook for this phone number
  try {
    const { setPhoneNumberWebhook } = await import('@/lib/vapi/auto-webhook')
    const webhookResult = await setPhoneNumberWebhook(providerPhoneId.trim())
    if (webhookResult.success) {
      console.log('[Client] ✅ Webhook automatically configured for phone number')
    }
  } catch (err) {
    console.warn('[Client] Failed to auto-configure webhook for phone number:', err)
  }

  revalidatePath('/app/inbound-ai')
  revalidatePath('/app/outbound-ai')
  revalidatePath('/app/settings')
  return { success: true }
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
  dailyLimit?: number
) {
  // Default to 20 for outbound/both, 100 for inbound-only
  const defaultLimit = type === 'inbound' ? 100 : 20
  const finalDailyLimit = dailyLimit ?? defaultLimit
  // Use service role client for admin operations to bypass RLS
  const supabase = createServiceRoleClient()
  
  // Validate UUID format for provider_phone_id
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(providerPhoneId.trim())) {
    return { error: 'Vapi Phone Number ID must be a UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)' }
  }
  
  // Normalize phone number to E.164 format for consistent storage
  const normalizedPhone = normalizePhoneNumberForStorage(phoneNumber)
  console.log('[Admin] Adding phone number:', phoneNumber, '-> normalized:', normalizedPhone)
  
  const { error } = await supabase.from('phone_numbers').insert({
    organization_id: organizationId,
    phone_number: normalizedPhone,
    provider_phone_id: providerPhoneId.trim(),
    friendly_name: friendlyName || null,
    type,
    daily_limit: finalDailyLimit,
    active: true,
  })

  if (error) {
    console.error('[Admin] Error adding phone number:', error)
    return { error: error.message }
  }

  // Auto-configure webhook for this phone number (scalable - no manual config needed)
  try {
    const { setPhoneNumberWebhook } = await import('@/lib/vapi/auto-webhook')
    const webhookResult = await setPhoneNumberWebhook(providerPhoneId.trim())
    if (webhookResult.success) {
      console.log(`[Admin] ✅ Auto-configured webhook for phone number ${providerPhoneId}`)
    } else {
      console.log(`[Admin] ⚠️ Could not auto-configure phone number webhook (may need assistant-level config): ${webhookResult.error}`)
    }
  } catch (err) {
    console.error('[Admin] Error auto-configuring webhook:', err)
    // Don't fail the operation if webhook config fails
  }

  return { success: true }
}

/**
 * Remove a phone number from an organization
 */
export async function adminRemovePhoneNumber(
  phoneNumberId: string,
  adminEmail: string
) {
  const supabase = createServiceRoleClient()

  // Get phone number details for logging
  const { data: phoneNumber, error: fetchError } = await supabase
    .from('phone_numbers')
    .select('id, phone_number, organization_id, provider_phone_id')
    .eq('id', phoneNumberId)
    .single()

  if (fetchError || !phoneNumber) {
    return { error: 'Phone number not found' }
  }

  // Optionally unassign from Vapi phone number (set assistantId to null)
  const vapiApiKey = process.env.VAPI_API_KEY
  if (vapiApiKey && phoneNumber.provider_phone_id) {
    try {
      const unassignResponse = await fetch(`https://api.vapi.ai/phone-number/${phoneNumber.provider_phone_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: null, // Unassign assistant
        }),
      })

      if (unassignResponse.ok) {
        console.log(`[Admin] ✅ Unassigned assistant from Vapi phone number ${phoneNumber.provider_phone_id}`)
      } else {
        const errorText = await unassignResponse.text()
        console.error(`[Admin] ⚠️ Failed to unassign Vapi phone number: ${unassignResponse.status} - ${errorText.substring(0, 200)}`)
        // Continue with deletion even if Vapi unassignment fails
      }
    } catch (err: any) {
      console.error(`[Admin] Error unassigning Vapi phone number:`, err?.message || err)
      // Continue with deletion even if Vapi call fails
    }
  }

  // Delete the phone number from database
  const { error: deleteError } = await supabase
    .from('phone_numbers')
    .delete()
    .eq('id', phoneNumberId)

  if (deleteError) {
    console.error('[Admin] Error removing phone number:', deleteError)
    return { error: deleteError.message }
  }

  console.log(`[Admin] ✅ Removed phone number ${phoneNumber.phone_number} (${phoneNumberId}) from org ${phoneNumber.organization_id}`)

  revalidatePath('/app/admin')
  return { 
    success: true, 
    message: `Phone number ${phoneNumber.phone_number} removed successfully` 
  }
}

export async function adminUpdatePhoneNumber(
  phoneNumberId: string,
  providerPhoneId?: string,
  friendlyName?: string,
  type?: 'inbound' | 'outbound' | 'both',
  dailyLimit?: number
) {
  // Use service role client for admin operations to bypass RLS
  const supabase = createServiceRoleClient()
  
  // Validate UUID format for provider_phone_id if provided
  if (providerPhoneId && providerPhoneId.trim()) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(providerPhoneId.trim())) {
      return { error: 'Vapi Phone Number ID must be a UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)' }
    }
  }
  
  const updateData: any = {}
  if (providerPhoneId && providerPhoneId.trim()) {
    updateData.provider_phone_id = providerPhoneId.trim()
  }
  if (friendlyName !== undefined) updateData.friendly_name = friendlyName || null
  if (type) updateData.type = type
  if (dailyLimit !== undefined) updateData.daily_limit = dailyLimit
  
  console.log('[Admin] Updating phone number:', phoneNumberId, updateData)
  
  const { error } = await supabase
    .from('phone_numbers')
    .update(updateData)
    .eq('id', phoneNumberId)

  if (error) {
    console.error('[Admin] Error updating phone number:', error)
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

