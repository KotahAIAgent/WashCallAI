import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendLeadNotification, determineNotificationType } from '@/lib/notifications/sms'
import { triggerWorkflows } from '@/lib/workflows/engine'
import { chargeVapiCall, shouldChargeCall } from '@/lib/vapi/stripe-billing'

// Status outcomes that count toward monthly billing (actual conversations)
const BILLABLE_STATUSES = ['answered', 'interested', 'not_interested', 'callback', 'completed']
// Status outcomes that do NOT count (no real conversation)
const NON_BILLABLE_STATUSES = ['voicemail', 'no_answer', 'wrong_number', 'failed', 'queued', 'pending', 'calling', 'ringing']

// Helper to check if organization has active access (trial or subscription)
async function checkOrganizationAccess(supabase: any, organizationId: string): Promise<{
  hasAccess: boolean
  reason: string
}> {
  const { data: org } = await supabase
    .from('organizations')
    .select('plan, trial_ends_at')
    .eq('id', organizationId)
    .single() as { data: { plan: string | null; trial_ends_at: string | null } | null }

  if (!org) {
    return { hasAccess: false, reason: 'Organization not found' }
  }

  // Has paid plan - always allow
  if (org.plan) {
    return { hasAccess: true, reason: 'active_plan' }
  }

  // Check trial status
  if (org.trial_ends_at) {
    const trialEndsAt = new Date(org.trial_ends_at)
    if (new Date() < trialEndsAt) {
      return { hasAccess: true, reason: 'active_trial' }
    } else {
      return { hasAccess: false, reason: 'Trial expired' }
    }
  }

  return { hasAccess: false, reason: 'No active subscription or trial' }
}

// Normalize phone number to E.164 format for matching
function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
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

// Test endpoint to verify webhook is accessible
export async function GET() {
  return NextResponse.json({ 
    message: 'Vapi webhook endpoint is active',
    timestamp: new Date().toISOString(),
    endpoint: '/api/vapi/webhook'
  })
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.json()
    console.log('[Webhook] Received raw payload:', JSON.stringify(rawPayload, null, 2))
    
    // Vapi wraps the call data in a "message" field
    const payload = rawPayload.message || rawPayload
    
    console.log('[Webhook] Extracted payload:', JSON.stringify(payload, null, 2))
    
    // Use service role client to bypass RLS (webhooks don't have user sessions)
    const supabase = createServiceRoleClient()
    
    // Try to identify organization from metadata or phone number
    let organizationId: string | null = null
    // Track call direction based on which agent ID matched
    let detectedDirection: 'inbound' | 'outbound' | null = null
    
    // Log all possible identifiers for debugging
    console.log('[Webhook] Payload identifiers:', {
      metadata: payload.metadata,
      assistantId: payload.assistantId,
      assistant: payload.assistant,
      assistant_id: payload.assistant_id,
      phoneNumberId: payload.phoneNumberId,
      phoneNumber: payload.phoneNumber,
      phone: payload.phone,
      phoneNumber_id: payload.phoneNumber_id,
      to: payload.to,
      from: payload.from,
      direction: payload.direction,
      type: payload.type,
      // Check nested structures
      call: payload.call,
      conversation: payload.conversation,
    })
    
    // Log the full payload structure (keys only to avoid huge logs)
    console.log('[Webhook] Payload top-level keys:', Object.keys(payload))
    
    // Check if metadata contains organizationId (from our outbound calls)
    if (payload.metadata?.organizationId) {
      organizationId = payload.metadata.organizationId
      console.log('[Webhook] Found organizationId from metadata:', organizationId)
    } else {
      // Try to find organization by assistant ID first (most reliable for inbound calls)
      // Vapi may send assistant ID in various formats
      const assistantId = payload.assistantId || 
                         payload.assistant_id || 
                         payload.assistant?.id || 
                         payload.assistant?.assistantId ||
                         payload.call?.assistantId ||
                         payload.conversation?.assistantId
      
      if (assistantId) {
        console.log('[Webhook] Looking up organization by assistant ID:', assistantId)
        // Try inbound first
        let { data: agentConfig, error: inboundError } = await supabase
          .from('agent_configs')
          .select('organization_id, inbound_agent_id, outbound_agent_id')
          .eq('inbound_agent_id', assistantId)
          .single() as { data: { organization_id: string; inbound_agent_id: string | null; outbound_agent_id: string | null } | null; error: any }
        
        if (inboundError) {
          console.log('[Webhook] Inbound lookup error:', inboundError)
        }
        
        // If found by inbound agent ID, this is an inbound call
        if (agentConfig) {
          detectedDirection = 'inbound'
        } else {
          // If not found, try outbound
          const { data: outboundConfig, error: outboundError } = await supabase
            .from('agent_configs')
            .select('organization_id, inbound_agent_id, outbound_agent_id')
            .eq('outbound_agent_id', assistantId)
            .single() as { data: { organization_id: string; inbound_agent_id: string | null; outbound_agent_id: string | null } | null; error: any }
          
          if (outboundError) {
            console.log('[Webhook] Outbound lookup error:', outboundError)
          }
          agentConfig = outboundConfig
          
          // If found by outbound agent ID, this is an outbound call
          if (agentConfig) {
            detectedDirection = 'outbound'
          }
        }
        
        if (agentConfig) {
          organizationId = agentConfig.organization_id
          console.log('[Webhook] ✅ Found organization by assistant ID:', organizationId, 'Direction:', detectedDirection)
        } else {
          console.log('[Webhook] ❌ No organization found for assistant ID:', assistantId)
          // Debug: List all agent configs to see what we have
          const { data: allConfigs } = await supabase
            .from('agent_configs')
            .select('organization_id, inbound_agent_id, outbound_agent_id')
          console.log('[Webhook] All agent configs in database:', JSON.stringify(allConfigs, null, 2))
        }
      } else {
        console.log('[Webhook] ⚠️ No assistant ID found in payload')
      }
      
      // If not found by assistant ID, look up by phone number
      if (!organizationId) {
        // Vapi may send phoneNumberId (provider ID) or the actual phone number
        const phoneNumberId = payload.phoneNumberId || 
                             payload.phoneNumber_id ||
                             payload.phoneNumber?.id ||
                             payload.phone?.id ||
                             payload.call?.phoneNumberId
        const toNumber = payload.to || 
                        payload.callee?.number || 
                        payload.phone?.number ||
                        payload.phoneNumber?.number ||
                        payload.call?.to ||
                        payload.phoneNumber?.phoneNumber
        
        console.log('[Webhook] Looking up organization - phoneNumberId:', phoneNumberId, 'toNumber:', toNumber)
      
      let phoneNumber: { organization_id: string; phone_number: string } | null = null
      
      // First, try to match by provider_phone_id (Vapi's phone number ID)
      if (phoneNumberId) {
        const { data: phoneByProviderId } = await supabase
          .from('phone_numbers')
          .select('organization_id, phone_number, provider_phone_id')
          .eq('provider_phone_id', phoneNumberId)
          .single() as { data: { organization_id: string; phone_number: string; provider_phone_id: string } | null }
        
        if (phoneByProviderId) {
          phoneNumber = phoneByProviderId
          console.log('[Webhook] Found by provider_phone_id:', phoneNumberId)
        }
      }
      
      // If not found by provider ID, try matching by actual phone number
      if (!phoneNumber && toNumber) {
        // Try exact match first
        const { data: phoneByNumber } = await supabase
          .from('phone_numbers')
          .select('organization_id, phone_number')
          .eq('phone_number', toNumber)
          .single() as { data: { organization_id: string; phone_number: string } | null }
        
        if (phoneByNumber) {
          phoneNumber = phoneByNumber
          console.log('[Webhook] Found by exact phone number match:', toNumber)
        } else {
          // Try normalized versions
          const normalized = normalizePhoneNumber(toNumber)
          console.log('[Webhook] Trying normalized phone:', normalized)
          
          if (normalized) {
            // Try normalized version
            const { data: phoneNumberNormalized } = await supabase
              .from('phone_numbers')
              .select('organization_id, phone_number')
              .eq('phone_number', normalized)
              .single() as { data: { organization_id: string; phone_number: string } | null }
            
            if (phoneNumberNormalized) {
              phoneNumber = phoneNumberNormalized
              console.log('[Webhook] Found by normalized phone number')
            } else {
              // Try matching any format - get all phone numbers and compare
              const { data: allPhones } = await supabase
                .from('phone_numbers')
                .select('organization_id, phone_number')
              
              if (allPhones) {
                const matched = allPhones.find(p => {
                  const pNormalized = normalizePhoneNumber(p.phone_number)
                  return pNormalized === normalized || pNormalized === normalizePhoneNumber(toNumber)
                })
                if (matched) {
                  phoneNumber = matched
                  console.log('[Webhook] Found by cross-format matching')
                }
              }
            }
          }
        }
      }
      
        if (phoneNumber) {
          organizationId = phoneNumber.organization_id
          console.log('[Webhook] Found organization:', organizationId, 'for phone:', phoneNumber.phone_number)
        } else {
          console.log('[Webhook] No phone number match found - phoneNumberId:', phoneNumberId, 'toNumber:', toNumber)
          console.log('[Webhook] Full payload keys:', Object.keys(payload))
          if (payload.phone) {
            console.log('[Webhook] payload.phone:', JSON.stringify(payload.phone, null, 2))
          }
        }
      }
    }

    // Fallback: get the first organization (for testing) - REMOVE IN PRODUCTION
    if (!organizationId) {
      console.log('[Webhook] ⚠️ Using fallback - could not find organization')
      console.log('[Webhook] Full payload for debugging:', JSON.stringify(payload, null, 2))
      
      // List all organizations with their phone numbers and assistant IDs for debugging
      const { data: allOrgs } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(10)
      console.log('[Webhook] Available organizations:', JSON.stringify(allOrgs, null, 2))
      
      // List all phone numbers
      const { data: allPhones } = await supabase
        .from('phone_numbers')
        .select('organization_id, phone_number, provider_phone_id, type')
      console.log('[Webhook] All phone numbers in database:', JSON.stringify(allPhones, null, 2))
      
      // List all agent configs
      const { data: allAgentConfigs } = await supabase
        .from('agent_configs')
        .select('organization_id, inbound_agent_id, outbound_agent_id')
      console.log('[Webhook] All agent configs:', JSON.stringify(allAgentConfigs, null, 2))
      
      // Store debug info for response
      const debugInfo = {
        payloadTopLevelKeys: Object.keys(payload),
        payloadIdentifiers: {
          metadata: payload.metadata,
          assistantId: payload.assistantId,
          assistant_id: payload.assistant_id,
          assistant: payload.assistant,
          phoneNumberId: payload.phoneNumberId,
          phoneNumber: payload.phoneNumber,
          phone: payload.phone,
          to: payload.to,
          from: payload.from,
          call: payload.call ? Object.keys(payload.call) : null,
        },
        availableOrganizations: allOrgs || [],
        availablePhoneNumbers: allPhones || [],
        availableAgentConfigs: allAgentConfigs || [],
      }
      
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single() as { data: { id: string } | null }

      if (!organizations) {
        console.error('[Webhook] No organizations found in database')
        return NextResponse.json({ 
          error: 'No organization found',
          debug: debugInfo
        }, { status: 400 })
      }
      organizationId = organizations.id
      console.log('[Webhook] Using fallback organization:', organizationId)
      
      // Log debug info in response for easier debugging
      console.log('[Webhook] DEBUG INFO:', JSON.stringify(debugInfo, null, 2))
    }

    // 🔒 CHECK ACCESS - Verify organization has active trial or subscription
    const accessCheck = await checkOrganizationAccess(supabase, organizationId)
    
    if (!accessCheck.hasAccess) {
      console.log(`⛔ Call blocked for org ${organizationId}: ${accessCheck.reason}`)
      
      // Still log the call attempt for records, but mark it as blocked
      await supabase.from('calls').insert({
        organization_id: organizationId,
        direction: payload.direction || 'inbound',
        provider_call_id: payload.callId || payload.id,
        from_number: payload.from || payload.caller?.number,
        to_number: payload.to || payload.callee?.number,
        status: 'failed',
        summary: `Call blocked: ${accessCheck.reason}`,
        raw_payload: payload,
      })

      // Return error - Vapi will handle the call rejection
      return NextResponse.json({ 
        error: accessCheck.reason,
        action: 'reject',
        message: 'Your trial has expired. Please subscribe to continue using FusionCaller.'
      }, { status: 403 })
    }

    // Determine call direction
    // Priority: 1) Detected from assistant ID lookup, 2) Payload direction, 3) Payload type, 4) Default to outbound
    const direction = detectedDirection || 
                     payload.direction || 
                     (payload.type === 'inbound' ? 'inbound' : null) ||
                     (payload.type === 'outbound' ? 'outbound' : null) ||
                     (payload.message?.direction) ||
                     (payload.message?.type === 'inbound' ? 'inbound' : null) ||
                     'outbound' // Default fallback

    // Extract call data from Vapi webhook payload
    // Vapi may send phone numbers in various formats, check all possibilities
    const fromNumber = payload.from || 
                      payload.caller?.number || 
                      payload.caller?.phoneNumber ||
                      payload.customer?.number ||
                      payload.customer?.phoneNumber ||
                      payload.message?.from ||
                      payload.message?.caller?.number
    const toNumber = payload.to || 
                    payload.callee?.number || 
                    payload.callee?.phoneNumber ||
                    payload.phoneNumber?.number ||
                    payload.phoneNumber?.phoneNumber ||
                    payload.message?.to ||
                    payload.message?.callee?.number
    
    // Extract provider_call_id from multiple possible locations
    const providerCallId = payload.callId || 
                          payload.id || 
                          payload.call?.id ||
                          payload.call?.callId ||
                          payload.message?.callId || 
                          payload.message?.id ||
                          payload.message?.call?.id
    
    // If no provider_call_id, we need to check for existing calls first
    // Then use a stable ID based on phone numbers + a time window
    // This ensures we can deduplicate even without Vapi's call ID
    let finalProviderCallId = providerCallId
    
    if (!finalProviderCallId && fromNumber && toNumber) {
      // Check for existing call with same numbers within last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { data: recentCall } = await supabase
        .from('calls')
        .select('id, provider_call_id, created_at')
        .eq('organization_id', organizationId)
        .eq('from_number', fromNumber)
        .eq('to_number', toNumber)
        .eq('direction', direction)
        .gte('created_at', twoMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (recentCall) {
        // Use the existing call's provider_call_id to ensure upsert works
        finalProviderCallId = recentCall.provider_call_id || `fallback_${recentCall.id}`
        console.log('[Webhook] Found recent call, using existing provider_call_id:', finalProviderCallId)
      } else {
        // Generate a stable ID for this call
        // Use a rounded timestamp (to nearest minute) so multiple webhook events share the same ID
        const roundedTimestamp = Math.floor(Date.now() / 60000) * 60000 // Round to nearest minute
        finalProviderCallId = `fallback_${fromNumber}_${toNumber}_${roundedTimestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_')
        console.log('[Webhook] Generated fallback provider_call_id:', finalProviderCallId)
      }
    }
    
    const callData = {
      organization_id: organizationId,
      direction: direction,
      provider_call_id: finalProviderCallId,
      from_number: fromNumber,
      to_number: toNumber,
      status: mapVapiStatus(payload.status || payload.state || payload.message?.status),
      duration_seconds: payload.duration || payload.message?.duration || null,
      recording_url: payload.recording?.url || payload.message?.recording?.url || null,
      transcript: payload.transcript || payload.conversation?.transcript || payload.message?.transcript || null,
      summary: payload.summary || payload.conversation?.summary || payload.message?.summary || null,
      raw_payload: payload,
    }
    
    console.log('[Webhook] Extracted call data:', {
      from_number: callData.from_number,
      to_number: callData.to_number,
      direction: callData.direction,
      status: callData.status,
      provider_call_id: callData.provider_call_id,
      hasVapiCallId: !!providerCallId,
    })

    // Create or update call
    // First check if call already exists by provider_call_id
    let existingCall = null
    let existingCallId = null
    
    if (callData.provider_call_id) {
      const { data: existing, error: existingError } = await supabase
        .from('calls')
        .select('id, lead_id, status, created_at, provider_call_id')
        .eq('provider_call_id', callData.provider_call_id)
        .maybeSingle()
      
      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.log('[Webhook] Error checking existing call:', existingError)
      }
      
      existingCall = existing
      existingCallId = existing?.id || null
      
      if (existingCall) {
        console.log('[Webhook] Found existing call by provider_call_id:', existingCall.id)
      }
    }
    
    const { data: call, error: callError } = await supabase
      .from('calls')
      .upsert(callData, {
        onConflict: 'provider_call_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (callError) {
      console.error('Error creating call:', callError)
      return NextResponse.json({ error: callError.message }, { status: 500 })
    }
    
    // Determine if this was a new call by comparing created_at
    // If the call was just created (within last 5 seconds), it's new
    // Otherwise, it's an update to an existing call
    const callCreatedAt = existingCall?.created_at ? new Date(existingCall.created_at) : null
    const now = new Date()
    const isNewCall = !existingCall || (callCreatedAt && (now.getTime() - callCreatedAt.getTime()) < 5000)
    
    console.log('[Webhook] Call upserted:', {
      callId: call?.id,
      providerCallId: callData.provider_call_id,
      status: callData.status,
      wasExisting: !!existingCall,
      existingCallId,
      isNewCall,
      callCreatedAt: callCreatedAt?.toISOString(),
    })

    // Variables for SMS notification
    let leadStatus = 'new'
    let leadData: {
      name?: string | null
      phone: string
      businessName?: string | null
      serviceType?: string | null
      propertyType?: string | null
      address?: string | null
      notes?: string | null
    } = {
      phone: callData.from_number || '',
    }

    // Declare leadId at function scope
    let leadId: string | undefined

    // For inbound calls, ALWAYS create a lead (even without structured output)
    // BUT only create/update lead once per call, not on every webhook event
    // For outbound calls, only create if we have structured output
    // Only create lead if:
    // 1. This is a new call (no existing call found), OR
    // 2. The call exists but has no lead_id yet (first time creating lead for this call), OR
    // 3. We have structured output/analysis (new data to update lead with)
    const isFinalStatus = callData.status === 'completed' || callData.status === 'answered'
    const hasNewData = !!(payload.lead || payload.structuredOutput || payload.analysis)
    const hasExistingLead = !!(existingCall?.lead_id)
    
    // For inbound: create if new call, or if call exists but no lead yet
    // For outbound: only if we have new structured data
    const shouldCreateLead = (direction === 'inbound' && (isNewCall || !hasExistingLead)) || 
                             (direction === 'outbound' && hasNewData)
    
    console.log('[Webhook] Lead creation check:', {
      direction,
      isNewCall,
      isFinalStatus,
      hasNewData,
      hasExistingLead,
      shouldCreateLead,
      callStatus: callData.status,
      existingLeadId: existingCall?.lead_id,
      providerCallId: callData.provider_call_id,
    })

    // Extract lead data if available (from structured output or transcript parsing)
    if (shouldCreateLead) {
      const extractedData = payload.lead || payload.structuredOutput || payload.analysis || {}
      
      // For inbound calls without structured data, default to 'new' status
      if (direction === 'inbound' && !extractedData.interested && !extractedData.wantsCallback) {
        leadStatus = 'new'
      } else {
        leadStatus = extractedData.interested === true ? 'interested' : 
                     extractedData.interested === false ? 'not_interested' : 
                     extractedData.wantsCallback ? 'callback' : 'new'
      }
      
      
      // For inbound calls, use from_number (caller's number)
      // For outbound calls, use to_number (who we called)
      const leadPhone = direction === 'inbound' 
        ? (extractedData.phone || callData.from_number)
        : (extractedData.phone || callData.to_number)
      
      if (!leadPhone) {
        console.error('[Webhook] No phone number found for lead creation')
      }
      
      const lead = {
        organization_id: organizationId,
        name: extractedData.name || extractNameFromTranscript(payload.transcript) || null,
        phone: leadPhone || callData.from_number || callData.to_number || 'unknown',
        email: extractedData.email || null,
        address: extractedData.address || null,
        city: extractedData.city || null,
        state: extractedData.state || null,
        zip_code: extractedData.zipCode || extractedData.zip_code || null,
        property_type: mapPropertyType(extractedData.propertyType || extractedData.property_type),
        service_type: extractedData.serviceType || extractedData.service_type || null,
        status: leadStatus,
        notes: extractedData.notes || callData.summary || (direction === 'inbound' ? 'Inbound call' : null),
        source: direction === 'inbound' ? 'inbound' : 'manual',
      }

      // Update leadData for SMS
      leadData = {
        name: lead.name,
        phone: lead.phone || '',
        businessName: extractedData.businessName || extractedData.companyName || null,
        serviceType: lead.service_type,
        propertyType: lead.property_type,
        address: lead.address,
        notes: lead.notes,
      }

      // Upsert lead (match by phone number and organization)
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone', lead.phone)
        .single() as { data: { id: string } | null }
      if (existingLead) {
        const { data: updatedLead } = await (supabase
          .from('leads') as any)
          .update(lead)
          .eq('id', existingLead.id)
          .select()
          .single()
        leadId = updatedLead?.id || existingLead.id
      } else {
        const { data: newLead } = await supabase
          .from('leads')
          .insert(lead)
          .select()
          .single()
        leadId = newLead?.id || ''
      }

      // Link call to lead
      if (leadId && call) {
        await (supabase
          .from('calls') as any)
          .update({ lead_id: leadId })
          .eq('id', call.id)
      }


      // Trigger new_lead workflow if this is a new lead
      if (!existingLead && leadId) {
        triggerWorkflows('new_lead', {
          organizationId,
          leadId,
        }).catch(err => console.error('Workflow trigger error:', err))
      }
    }

    // Handle campaign contact updates (for outbound calls)
    if (payload.metadata?.campaignContactId) {
      const { campaignContactId } = payload.metadata
      
      // Update campaign contact with call outcome
      const contactStatus = leadStatus === 'interested' ? 'interested' :
                           leadStatus === 'callback' ? 'callback' :
                           leadStatus === 'not_interested' ? 'not_interested' :
                           callData.status === 'voicemail' ? 'voicemail' :
                           callData.status === 'answered' ? 'answered' : 'no_answer'

      await (supabase
        .from('campaign_contacts') as any)
        .update({
          status: contactStatus,
          call_count: supabase.rpc('increment', { x: 1 }),
          last_call_at: new Date().toISOString(),
          last_call_outcome: callData.status,
          last_call_summary: callData.summary,
        })
        .eq('id', campaignContactId)
    }

    // 📊 TRACK BILLABLE OUTBOUND CALLS
    // Only count calls toward monthly limit if they were answered (actual conversation)
    if (direction === 'outbound' && (payload.status === 'ended' || payload.status === 'completed')) {
      const contactStatus = leadStatus === 'interested' ? 'interested' :
                           leadStatus === 'callback' ? 'callback' :
                           leadStatus === 'not_interested' ? 'not_interested' :
                           callData.status === 'answered' || callData.status === 'completed' ? 'answered' :
                           callData.status

      // Check if this call should count toward monthly billing
      const isBillable = BILLABLE_STATUSES.includes(contactStatus)

      if (isBillable) {
        // Get current organization billing info
        const { data: org } = await supabase
          .from('organizations')
          .select('billable_calls_this_month, billing_period_month, billing_period_year')
          .eq('id', organizationId)
          .single() as { data: { billable_calls_this_month: number | null; billing_period_month: number | null; billing_period_year: number | null } | null }

        if (org) {
          const now = new Date()
          const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
          const currentYear = now.getFullYear()

          // Check if we need to reset the counter for a new billing period
          if (org.billing_period_month !== currentMonth || org.billing_period_year !== currentYear) {
            // New billing period - reset counter
            await (supabase
              .from('organizations') as any)
              .update({
                billable_calls_this_month: 1,
                billing_period_month: currentMonth,
                billing_period_year: currentYear,
              })
              .eq('id', organizationId)
          } else {
            // Same billing period - increment counter
            await (supabase
              .from('organizations') as any)
              .update({
                billable_calls_this_month: (org.billable_calls_this_month || 0) + 1,
              })
              .eq('id', organizationId)
          }
        }

        console.log(`📊 Billable call counted: ${contactStatus} for org ${organizationId}`)

        // 💳 CHARGE VAPI CALL VIA STRIPE (if overage)
        // Check if this call exceeds plan limits and should be charged
        const chargeCheck = await shouldChargeCall(organizationId)
        
        if (chargeCheck.shouldCharge && call?.id) {
          const callDuration = callData.duration_seconds || 0
          
          // Charge for overage call
          const chargeResult = await chargeVapiCall({
            organizationId,
            callId: call.id,
            callDuration,
            callDirection: direction as 'inbound' | 'outbound',
            isOverage: true,
          })

          if (chargeResult.success) {
            console.log(`💳 Stripe charge created: ${chargeResult.message}`)
          } else {
            console.error(`❌ Failed to charge call: ${chargeResult.error}`)
          }
        }
      } else {
        console.log(`📊 Non-billable call (${contactStatus}) - not counted toward monthly limit`)
      }
    }

    // 📱 SEND SMS NOTIFICATION
    // Only send when call is completed/ended
    if (payload.status === 'ended' || payload.status === 'completed' || callData.status === 'completed') {
      const notificationType = determineNotificationType(
        direction as 'inbound' | 'outbound',
        leadStatus,
        false
      )

      if (notificationType) {
        // Send notification asynchronously (don't await to not block webhook response)
        sendLeadNotification(organizationId, notificationType, leadData)
          .then(result => {
            if (result.success) {
              console.log(`SMS notification sent: ${notificationType}`)
            } else {
              console.log(`SMS not sent: ${result.error}`)
            }
          })
          .catch(err => {
            console.error('SMS notification error:', err)
          })
      }

      // Trigger call_completed workflow
      if (call?.id) {
        triggerWorkflows('call_completed', {
          organizationId,
          callId: call.id,
          leadId,
        }).catch(err => console.error('Workflow trigger error:', err))
      }
    }

    return NextResponse.json({ success: true, callId: call?.id })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function mapVapiStatus(status: string): 'queued' | 'ringing' | 'answered' | 'completed' | 'failed' | 'voicemail' {
  const statusMap: Record<string, 'queued' | 'ringing' | 'answered' | 'completed' | 'failed' | 'voicemail'> = {
    queued: 'queued',
    ringing: 'ringing',
    answered: 'answered',
    completed: 'completed',
    failed: 'failed',
    voicemail: 'voicemail',
    'in-progress': 'answered',
    ended: 'completed',
    busy: 'failed',
    'no-answer': 'failed',
  }
  return statusMap[status?.toLowerCase()] || 'completed'
}

function mapPropertyType(type: string | null): 'residential' | 'commercial' | 'unknown' {
  if (!type) return 'unknown'
  const lower = type.toLowerCase()
  if (lower.includes('residential') || lower.includes('house') || lower.includes('home')) {
    return 'residential'
  }
  if (lower.includes('commercial') || lower.includes('business') || lower.includes('office')) {
    return 'commercial'
  }
  return 'unknown'
}

function extractNameFromTranscript(transcript: string | null): string | null {
  if (!transcript) return null
  // Simple extraction - in production, use NLP or structured extraction
  const nameMatch = transcript.match(/(?:name is|I'm|I am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
  return nameMatch ? nameMatch[1] : null
}
