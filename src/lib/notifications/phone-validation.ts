/**
 * Validate phone number using Twilio Lookup API
 * Checks if number is valid and SMS-capable
 */
export async function validatePhoneNumberForSMS(
  phoneNumber: string
): Promise<{
  valid: boolean
  smsCapable: boolean
  formatted?: string
  error?: string
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    // Fallback to basic format validation if Twilio not configured
    const normalized = normalizePhoneNumber(phoneNumber)
    return {
      valid: !!normalized,
      smsCapable: !!normalized,
      formatted: normalized ?? undefined,
    }
  }

  try {
    // Normalize phone number first
    const normalized = normalizePhoneNumber(phoneNumber)
    if (!normalized) {
      return { valid: false, smsCapable: false, error: 'Invalid phone format' }
    }

    // Use Twilio Lookup API to validate
    const response = await fetch(
      `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(normalized)}?Type=carrier`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        },
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      // If number not found, it's invalid
      if (response.status === 404) {
        return { valid: false, smsCapable: false, error: 'Phone number not found' }
      }
      // For other errors, assume valid but log
      console.warn('Twilio Lookup error:', error)
      return { valid: true, smsCapable: true, formatted: normalized ?? undefined }
    }

    const data = await response.json()
    const carrierType = data.carrier?.type || ''
    
    // Check if SMS-capable (mobile, voip, landline can sometimes receive SMS)
    const smsCapable = ['mobile', 'voip'].includes(carrierType.toLowerCase()) || 
                       carrierType.toLowerCase() === 'landline' // Some landlines can receive SMS

    return {
      valid: true,
      smsCapable,
      formatted: normalized ?? undefined,
    }
  } catch (error: any) {
    console.error('Phone validation error:', error)
    // On error, assume valid to avoid blocking legitimate sends
    const normalized = normalizePhoneNumber(phoneNumber)
    return {
      valid: !!normalized,
      smsCapable: true,
      formatted: normalized || undefined,
    }
  }
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  
  // Remove all non-digit characters except +
  const digits = phone.replace(/[^\d+]/g, '')
  
  // If it starts with 1 and has 11 digits, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // If it has 10 digits, add +1
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone
  }
  
  // If it starts with 1 and has 11 digits without +, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  return null
}

