'use server'

import { createActionClient } from '@/lib/supabase/server'

const VAPI_API_URL = 'https://api.vapi.ai'

/**
 * Assigns a phone number to an assistant (for inbound calls)
 */
export async function assignPhoneNumberToAssistant(
  organizationId: string,
  assistantId: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify user has access
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('profile_id', session.user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!member) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get assistant
  const { data: assistant, error: assistantError } = await supabase
    .from('assistants')
    .select('assistant_id, type')
    .eq('id', assistantId)
    .eq('organization_id', organizationId)
    .single()

  if (assistantError || !assistant) {
    return { success: false, error: 'Assistant not found' }
  }

  if (!assistant.assistant_id) {
    return { success: false, error: 'Assistant does not have a VAPI assistant ID' }
  }

  // Get phone number
  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('provider_phone_id, phone_number, type')
    .eq('id', phoneNumberId)
    .eq('organization_id', organizationId)
    .single()

  if (phoneError || !phoneNumber) {
    return { success: false, error: 'Phone number not found' }
  }

  if (!phoneNumber.provider_phone_id) {
    return { success: false, error: 'Phone number does not have a VAPI phone ID' }
  }

  // For inbound assistants, assign to phone numbers that support inbound
  if (assistant.type === 'inbound') {
    if (!['inbound', 'both'].includes(phoneNumber.type || '')) {
      return { success: false, error: 'This phone number does not support inbound calls' }
    }

    const vapiApiKey = process.env.VAPI_API_KEY
    if (!vapiApiKey) {
      return { success: false, error: 'VAPI API key not configured' }
    }

    try {
      const response = await fetch(`${VAPI_API_URL}/phone-number/${phoneNumber.provider_phone_id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistant.assistant_id,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { success: false, error: `Failed to assign phone number: ${errorText.substring(0, 200)}` }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to assign phone number' }
    }
  } else {
    // For outbound assistants, we don't assign to phone numbers directly
    // Instead, they're used when initiating calls
    return { success: false, error: 'Outbound assistants are used when making calls, not assigned to phone numbers' }
  }
}

/**
 * Unassigns a phone number from an assistant
 */
export async function unassignPhoneNumberFromAssistant(
  organizationId: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify user has access
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('profile_id', session.user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!member) {
    return { success: false, error: 'Unauthorized' }
  }

  // Get phone number
  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_numbers')
    .select('provider_phone_id')
    .eq('id', phoneNumberId)
    .eq('organization_id', organizationId)
    .single()

  if (phoneError || !phoneNumber || !phoneNumber.provider_phone_id) {
    return { success: false, error: 'Phone number not found' }
  }

  const vapiApiKey = process.env.VAPI_API_KEY
  if (!vapiApiKey) {
    return { success: false, error: 'VAPI API key not configured' }
  }

  try {
    const response = await fetch(`${VAPI_API_URL}/phone-number/${phoneNumber.provider_phone_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: null, // Unassign
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `Failed to unassign phone number: ${errorText.substring(0, 200)}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to unassign phone number' }
  }
}

