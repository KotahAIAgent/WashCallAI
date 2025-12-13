import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { generateHormoziSMS } from '@/lib/ai/sms-generator'
import { validatePhoneNumberForSMS } from './phone-validation'

export interface CallData {
  direction: 'inbound' | 'outbound'
  callStatus: 'completed' | 'answered' | 'voicemail' | 'failed'
  leadStatus: 'interested' | 'not_interested' | 'callback' | 'new'
  clientName?: string | null
  clientPhone: string
  organizationId: string
  serviceType?: string | null
  address?: string | null
  transcript?: string | null
  summary?: string | null
  supabaseClient?: any // Optional: allows passing service role client from webhooks
}

/**
 * Send Hormozi-style SMS to client after call completion
 */
export async function sendClientSMS(callData: CallData): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  console.log('[sendClientSMS] Starting SMS send process:', {
    organizationId: callData.organizationId,
    clientPhone: callData.clientPhone,
    direction: callData.direction,
    callStatus: callData.callStatus
  })

  // Use provided client (service role from webhook) or create new one
  const supabase = callData.supabaseClient || createServerClient()

  // Get organization details for context
  // Try to get client_sms_enabled, but if column doesn't exist, that's OK (defaults to enabled)
  let org: any = null
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('name, industry, services_offered, client_sms_enabled')
    .eq('id', callData.organizationId)
    .single()

  if (orgError) {
    // If error is about missing column, try without it
    if (orgError.message?.includes('client_sms_enabled') || orgError.code === '42703') {
      console.log('[sendClientSMS] ⚠️ client_sms_enabled column not found, trying without it...')
      const { data: orgRetry, error: orgRetryError } = await supabase
        .from('organizations')
        .select('name, industry, services_offered')
        .eq('id', callData.organizationId)
        .single()
      
      if (orgRetryError || !orgRetry) {
        console.error('[sendClientSMS] ❌ Organization not found:', orgRetryError)
        return { success: false, error: 'Organization not found' }
      }
      
      // Use retry result and default client_sms_enabled to true
      org = { ...orgRetry, client_sms_enabled: true }
      
      console.log('[sendClientSMS] Organization found (without client_sms_enabled column, defaulting to enabled):', {
        name: org.name,
        client_sms_enabled: org.client_sms_enabled
      })
    } else {
      console.error('[sendClientSMS] ❌ Organization not found:', orgError)
      return { success: false, error: 'Organization not found' }
    }
  } else if (orgData) {
    org = orgData
    // If client_sms_enabled is null/undefined (column doesn't exist), default to true
    if (org.client_sms_enabled === null || org.client_sms_enabled === undefined) {
      org.client_sms_enabled = true
    }
  }

  if (!org) {
    console.error('[sendClientSMS] ❌ Organization not found')
    return { success: false, error: 'Organization not found' }
  }

  console.log('[sendClientSMS] Organization found:', {
    name: org.name,
    client_sms_enabled: org.client_sms_enabled,
    hasServices: !!org.services_offered
  })

  // Check if client SMS is enabled (optional feature flag)
  // Default to true if not set (backward compatibility)
  // If column doesn't exist, it will be null/undefined, which we treat as enabled
  if (org.client_sms_enabled === false) {
    console.log('[sendClientSMS] ⏭️ Client SMS disabled for this organization')
    return { success: false, error: 'Client SMS disabled for this organization' }
  }

  // Validate phone number
  console.log('[sendClientSMS] Validating phone number:', callData.clientPhone)
  const validation = await validatePhoneNumberForSMS(callData.clientPhone)
  console.log('[sendClientSMS] Phone validation result:', validation)
  
  if (!validation.valid) {
    console.log('[sendClientSMS] ❌ Phone number invalid:', validation.error)
    return { success: false, error: validation.error || 'Invalid phone number' }
  }

  if (!validation.smsCapable) {
    console.log('[sendClientSMS] ❌ Phone number not SMS capable')
    return { success: false, error: 'Phone number not SMS capable' }
  }

  const formattedPhone = validation.formatted || callData.clientPhone
  console.log('[sendClientSMS] Phone validated, formatted:', formattedPhone)

  // Generate Hormozi-style message
  console.log('[sendClientSMS] Generating AI message...')
  const aiResult = await generateHormoziSMS({
    direction: callData.direction,
    callStatus: callData.callStatus,
    leadStatus: callData.leadStatus,
    clientName: callData.clientName,
    clientPhone: formattedPhone,
    companyName: org.name,
    serviceType: callData.serviceType,
    address: callData.address,
    transcript: callData.transcript || null,
    summary: callData.summary || null,
    industry: org.industry || null,
    servicesOffered: (org.services_offered as string[]) || null,
  })

  if (!aiResult.success || !aiResult.message) {
    console.error('[sendClientSMS] ❌ AI message generation failed:', aiResult.error)
    return { success: false, error: aiResult.error || 'Failed to generate message' }
  }

  console.log('[sendClientSMS] ✅ AI message generated:', aiResult.message.substring(0, 100) + '...')

  // Send SMS via Twilio
  console.log('[sendClientSMS] Sending SMS via Twilio...')
  const smsResult = await sendTwilioSMS(formattedPhone, aiResult.message)

  if (smsResult.success) {
    // Log successful send
    console.log(`[sendClientSMS] ✅ Client SMS sent to ${formattedPhone}: ${aiResult.message.substring(0, 50)}...`)
  } else {
    console.error(`[sendClientSMS] ❌ Twilio SMS failed: ${smsResult.error}`)
  }

  return {
    success: smsResult.success,
    message: aiResult.message,
    error: smsResult.error,
  }
}

/**
 * Send SMS via Twilio
 */
async function sendTwilioSMS(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured')
    return { success: false, error: 'SMS not configured' }
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Twilio error:', error)
      return { success: false, error: error.message || 'Failed to send SMS' }
    }

    return { success: true }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error: 'Failed to send SMS' }
  }
}

