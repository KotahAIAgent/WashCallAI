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
    const payload = await request.json()
    console.log('[Webhook] Received payload:', JSON.stringify(payload, null, 2))
    // Use service role client to bypass RLS (webhooks don't have user sessions)
    const supabase = createServiceRoleClient()
    
    // Try to identify organization from metadata or phone number
    let organizationId: string | null = null
    
    // Check if metadata contains organizationId (from our outbound calls)
    if (payload.metadata?.organizationId) {
      organizationId = payload.metadata.organizationId
      console.log('[Webhook] Found organizationId from metadata:', organizationId)
    } else {
      // Try to find organization by assistant ID first (most reliable for inbound calls)
      const assistantId = payload.assistantId || payload.assistant?.id
      
      if (assistantId) {
        console.log('[Webhook] Looking up organization by assistant ID:', assistantId)
        // Try inbound first
        let { data: agentConfig } = await supabase
          .from('agent_configs')
          .select('organization_id')
          .eq('inbound_agent_id', assistantId)
          .single() as { data: { organization_id: string } | null }
        
        // If not found, try outbound
        if (!agentConfig) {
          const { data: outboundConfig } = await supabase
            .from('agent_configs')
            .select('organization_id')
            .eq('outbound_agent_id', assistantId)
            .single() as { data: { organization_id: string } | null }
          agentConfig = outboundConfig
        }
        
        if (agentConfig) {
          organizationId = agentConfig.organization_id
          console.log('[Webhook] Found organization by assistant ID:', organizationId)
        } else {
          console.log('[Webhook] No organization found for assistant ID:', assistantId)
        }
      }
      
      // If not found by assistant ID, look up by phone number
      if (!organizationId) {
        // Vapi may send phoneNumberId (provider ID) or the actual phone number
        const phoneNumberId = payload.phoneNumberId || payload.phone?.id
        const toNumber = payload.to || payload.callee?.number || payload.phone?.number
        
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
      console.log('[Webhook] Using fallback - getting first organization')
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single() as { data: { id: string } | null }

      if (!organizations) {
        console.error('[Webhook] No organizations found in database')
        return NextResponse.json({ error: 'No organization found' }, { status: 400 })
      }
      organizationId = organizations.id
      console.log('[Webhook] Using fallback organization:', organizationId)
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
    const direction = payload.direction || (payload.type === 'inbound' ? 'inbound' : 'outbound')

    // Extract call data from Vapi webhook payload
    const callData = {
      organization_id: organizationId,
      direction: direction,
      provider_call_id: payload.callId || payload.id,
      from_number: payload.from || payload.caller?.number,
      to_number: payload.to || payload.callee?.number,
      status: mapVapiStatus(payload.status || payload.state),
      duration_seconds: payload.duration || null,
      recording_url: payload.recording?.url || null,
      transcript: payload.transcript || payload.conversation?.transcript || null,
      summary: payload.summary || payload.conversation?.summary || null,
      raw_payload: payload,
    }

    // Create or update call
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

    // Variables for SMS notification
    let leadStatus = 'new'
    let hasAppointment = false
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
    // For outbound calls, only create if we have structured output
    const shouldCreateLead = direction === 'inbound' || payload.lead || payload.structuredOutput || payload.analysis

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
      
      hasAppointment = !!extractedData.appointment || !!extractedData.scheduledTime
      
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
        status: hasAppointment ? 'booked' : leadStatus,
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

      // Create appointment if scheduled
      if (hasAppointment && leadId) {
        const appointmentTime = extractedData.appointmentTime || extractedData.scheduledTime
        if (appointmentTime) {
          const { data: appointment } = await supabase.from('appointments').insert({
            organization_id: organizationId,
            lead_id: leadId,
            title: `Estimate for ${lead.name || 'Lead'}`,
            start_time: new Date(appointmentTime).toISOString(),
            end_time: new Date(new Date(appointmentTime).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
            notes: lead.service_type ? `Service: ${lead.service_type}` : null,
          }).select().single()

          // Trigger appointment_booked workflow
          if (appointment) {
            triggerWorkflows('appointment_booked', {
              organizationId,
              appointmentId: appointment.id,
              leadId,
            }).catch(err => console.error('Workflow trigger error:', err))
          }
        }
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
        hasAppointment
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
