/**
 * Twilio Phone Number Integration
 * White-labeled integration for searching and purchasing phone numbers
 */

const TWILIO_API_URL = 'https://api.twilio.com/2010-04-01'

interface TwilioPhoneNumberSearchParams {
  areaCode?: string
  country?: string
  contains?: string
  limit?: number
  locality?: string
  region?: string
  postalCode?: string
}

interface TwilioAvailableNumber {
  friendlyName: string
  phoneNumber: string
  region: string
  locality: string
  postalCode?: string
  isoCountry: string
  capabilities: {
    voice: boolean
    SMS: boolean
    MMS: boolean
  }
}

interface TwilioPurchasedNumber {
  sid: string
  friendlyName: string
  phoneNumber: string
}

/**
 * Search for available phone numbers from Twilio
 */
export async function searchAvailablePhoneNumbers(
  params: TwilioPhoneNumberSearchParams
): Promise<{ success: boolean; numbers?: TwilioAvailableNumber[]; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    const searchParams = new URLSearchParams()
    
    // Add search parameters
    if (params.areaCode) searchParams.append('AreaCode', params.areaCode)
    if (params.country) searchParams.append('CountryCode', params.country)
    if (params.contains) searchParams.append('Contains', params.contains)
    if (params.locality) searchParams.append('InLocality', params.locality)
    if (params.region) searchParams.append('InRegion', params.region)
    if (params.postalCode) searchParams.append('InPostalCode', params.postalCode)
    
    // Default to US and set limit
    if (!params.country) searchParams.append('CountryCode', 'US')
    searchParams.append('Limit', (params.limit || 20).toString())

    const url = `${TWILIO_API_URL}/Accounts/${accountSid}/AvailablePhoneNumbers/US/Local.json?${searchParams.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Twilio] Search error:', error)
      return { success: false, error: error.message || 'Failed to search phone numbers' }
    }

    const data = await response.json()
    return { success: true, numbers: data.available_phone_numbers || [] }
  } catch (error: any) {
    console.error('[Twilio] Search exception:', error)
    return { success: false, error: error.message || 'Failed to search phone numbers' }
  }
}

/**
 * Purchase a phone number from Twilio
 */
export async function purchasePhoneNumber(
  phoneNumber: string,
  organizationId: string,
  friendlyName?: string
): Promise<{ success: boolean; number?: TwilioPurchasedNumber; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio not configured' }
  }

  try {
    const url = `${TWILIO_API_URL}/Accounts/${accountSid}/IncomingPhoneNumbers.json`
    
    const body = new URLSearchParams({
      PhoneNumber: phoneNumber,
      FriendlyName: friendlyName || `FusionCaller - ${organizationId.substring(0, 8)}`,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Twilio] Purchase error:', error)
      return { success: false, error: error.message || 'Failed to purchase phone number' }
    }

    const data = await response.json()
    return {
      success: true,
      number: {
        sid: data.sid,
        friendlyName: data.friendly_name,
        phoneNumber: data.phone_number,
      },
    }
  } catch (error: any) {
    console.error('[Twilio] Purchase exception:', error)
    return { success: false, error: error.message || 'Failed to purchase phone number' }
  }
}

/**
 * Register phone number with VAPI (if needed)
 * Note: VAPI typically works with Twilio numbers using the Twilio SID directly
 * This function is kept for future use if VAPI requires explicit registration
 */
export async function registerPhoneNumberWithVAPI(
  phoneNumber: string,
  twilioPhoneSid: string
): Promise<{ success: boolean; vapiPhoneId?: string; error?: string }> {
  // For now, VAPI can use Twilio phone numbers directly via their SID
  // No explicit registration needed - just store the Twilio SID
  // This function is kept for future use if VAPI API changes
  return { success: true, vapiPhoneId: twilioPhoneSid }
}

/**
 * Get pricing for a phone number (Twilio pricing)
 */
export async function getPhoneNumberPricing(phoneNumber: string): Promise<{
  success: boolean
  monthlyFee?: number
  setupFee?: number
  error?: string
}> {
  // Twilio local numbers typically cost $1/month
  // You can adjust pricing based on your markup strategy
  return {
    success: true,
    monthlyFee: 100, // $1.00 in cents (base Twilio cost)
    setupFee: 0, // No setup fee, but you can add your markup here
  }
}

