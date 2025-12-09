// Supabase Edge Function to receive Vapi webhooks
// This function receives webhook data from Vapi and processes it

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook payload
    const payload = await req.json()
    console.log('[Vapi Webhook] Received payload:', JSON.stringify(payload, null, 2))

    // Try to identify organization from metadata or phone number
    let organizationId: string | null = null

    // Check if metadata contains organizationId (from our outbound calls)
    if (payload.metadata?.organizationId) {
      organizationId = payload.metadata.organizationId
      console.log('[Vapi Webhook] Found organizationId from metadata:', organizationId)
    } else {
      // For inbound calls, look up by phone number
      const phoneNumberId = payload.phoneNumberId || payload.phone?.id
      const toNumber = payload.to || payload.callee?.number || payload.phone?.number

      console.log('[Vapi Webhook] Looking up organization - phoneNumberId:', phoneNumberId, 'toNumber:', toNumber)

      if (phoneNumberId) {
        // Try to match by provider_phone_id
        const { data: phoneNumber } = await supabase
          .from('phone_numbers')
          .select('organization_id, phone_number, provider_phone_id')
          .eq('provider_phone_id', phoneNumberId)
          .single()

        if (phoneNumber) {
          organizationId = phoneNumber.organization_id
          console.log('[Vapi Webhook] Found by provider_phone_id:', phoneNumberId)
        }
      }

      // If not found by provider ID, try matching by actual phone number
      if (!organizationId && toNumber) {
        // Normalize phone number
        const digits = toNumber.replace(/\D/g, '')
        let normalized = toNumber
        if (digits.length === 11 && digits.startsWith('1')) {
          normalized = `+${digits}`
        } else if (digits.length === 10) {
          normalized = `+1${digits}`
        }

        const { data: phoneNumber } = await supabase
          .from('phone_numbers')
          .select('organization_id, phone_number')
          .or(`phone_number.eq.${toNumber},phone_number.eq.${normalized}`)
          .single()

        if (phoneNumber) {
          organizationId = phoneNumber.organization_id
          console.log('[Vapi Webhook] Found by phone number')
        }
      }
    }

    // Fallback: get first organization (for testing)
    if (!organizationId) {
      console.log('[Vapi Webhook] Using fallback - getting first organization')
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (organizations) {
        organizationId = organizations.id
        console.log('[Vapi Webhook] Using fallback organization:', organizationId)
      }
    }

    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine call direction
    const direction = payload.direction || (payload.type === 'inbound' ? 'inbound' : 'outbound')

    // Extract call data
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
      console.error('[Vapi Webhook] Error creating call:', callError)
      return new Response(
        JSON.stringify({ error: callError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For inbound calls, create a lead
    if (direction === 'inbound' && callData.from_number) {
      const leadPhone = callData.from_number

      // Check if lead exists
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone', leadPhone)
        .single()

      let leadId: string | undefined

      if (existingLead) {
        leadId = existingLead.id
        // Update existing lead
        await supabase
          .from('leads')
          .update({
            notes: callData.summary || 'Inbound call',
          })
          .eq('id', leadId)
      } else {
        // Create new lead
        const { data: newLead } = await supabase
          .from('leads')
          .insert({
            organization_id: organizationId,
            phone: leadPhone,
            status: 'new',
            source: 'inbound',
            notes: callData.summary || 'Inbound call',
          })
          .select()
          .single()

        leadId = newLead?.id
      }

      // Link call to lead
      if (leadId && call) {
        await supabase
          .from('calls')
          .update({ lead_id: leadId })
          .eq('id', call.id)
      }
    }

    return new Response(
      JSON.stringify({ success: true, callId: call?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('[Vapi Webhook] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

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

