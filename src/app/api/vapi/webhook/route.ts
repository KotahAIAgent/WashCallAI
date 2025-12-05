import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendLeadNotification, determineNotificationType } from '@/lib/notifications/sms'

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
    .single()

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

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const supabase = createServerClient()
    
    // Try to identify organization from metadata or phone number
    let organizationId: string | null = null
    
    // Check if metadata contains organizationId (from our outbound calls)
    if (payload.metadata?.organizationId) {
      organizationId = payload.metadata.organizationId
    } else {
      // For inbound calls, look up by phone number
      const toNumber = payload.to || payload.callee?.number
      if (toNumber) {
        const { data: phoneNumber } = await supabase
          .from('phone_numbers')
          .select('organization_id')
          .eq('phone_number', toNumber)
          .single()
        
        if (phoneNumber) {
          organizationId = phoneNumber.organization_id
        }
      }
    }

    // Fallback: get the first organization (for testing)
    if (!organizationId) {
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!organizations) {
        return NextResponse.json({ error: 'No organization found' }, { status: 400 })
      }
      organizationId = organizations.id
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
        message: 'Your trial has expired. Please subscribe to continue using WashCall AI.'
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

    // Extract lead data if available (from structured output or transcript parsing)
    if (payload.lead || payload.structuredOutput || payload.analysis) {
      const extractedData = payload.lead || payload.structuredOutput || payload.analysis
      
      leadStatus = extractedData.interested === true ? 'interested' : 
                   extractedData.interested === false ? 'not_interested' : 
                   extractedData.wantsCallback ? 'callback' : 'new'
      
      hasAppointment = !!extractedData.appointment || !!extractedData.scheduledTime
      
      const lead = {
        organization_id: organizationId,
        name: extractedData.name || extractNameFromTranscript(payload.transcript),
        phone: extractedData.phone || callData.from_number,
        email: extractedData.email || null,
        address: extractedData.address || null,
        city: extractedData.city || null,
        state: extractedData.state || null,
        zip_code: extractedData.zipCode || extractedData.zip_code || null,
        property_type: mapPropertyType(extractedData.propertyType || extractedData.property_type),
        service_type: extractedData.serviceType || extractedData.service_type || null,
        status: hasAppointment ? 'booked' : leadStatus,
        notes: extractedData.notes || callData.summary || null,
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
        .single()

      let leadId: string
      if (existingLead) {
        const { data: updatedLead } = await supabase
          .from('leads')
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
        await supabase
          .from('calls')
          .update({ lead_id: leadId })
          .eq('id', call.id)
      }

      // Create appointment if scheduled
      if (hasAppointment && leadId) {
        const appointmentTime = extractedData.appointmentTime || extractedData.scheduledTime
        if (appointmentTime) {
          await supabase.from('appointments').insert({
            organization_id: organizationId,
            lead_id: leadId,
            title: `Estimate for ${lead.name || 'Lead'}`,
            start_time: new Date(appointmentTime).toISOString(),
            end_time: new Date(new Date(appointmentTime).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
            notes: lead.service_type ? `Service: ${lead.service_type}` : null,
          })
        }
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

      await supabase
        .from('campaign_contacts')
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
          .single()

        if (org) {
          const now = new Date()
          const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
          const currentYear = now.getFullYear()

          // Check if we need to reset the counter for a new billing period
          if (org.billing_period_month !== currentMonth || org.billing_period_year !== currentYear) {
            // New billing period - reset counter
            await supabase
              .from('organizations')
              .update({
                billable_calls_this_month: 1,
                billing_period_month: currentMonth,
                billing_period_year: currentYear,
              })
              .eq('id', organizationId)
          } else {
            // Same billing period - increment counter
            await supabase
              .from('organizations')
              .update({
                billable_calls_this_month: (org.billable_calls_this_month || 0) + 1,
              })
              .eq('id', organizationId)
          }
        }

        console.log(`📊 Billable call counted: ${contactStatus} for org ${organizationId}`)
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
