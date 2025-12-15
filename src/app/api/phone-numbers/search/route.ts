import { NextResponse } from 'next/server'
import { createActionClient } from '@/lib/supabase/server'
import { searchAvailablePhoneNumbers } from '@/lib/twilio/phone-numbers'

export async function GET(request: Request) {
  try {
    // Verify authentication
    const supabase = createActionClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get search parameters from query string
    const { searchParams } = new URL(request.url)
    const areaCode = searchParams.get('areaCode') || undefined
    const country = searchParams.get('country') || undefined
    const contains = searchParams.get('contains') || undefined
    const locality = searchParams.get('locality') || undefined
    const region = searchParams.get('region') || undefined
    const postalCode = searchParams.get('postalCode') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')

    // Search for available numbers
    const result = await searchAvailablePhoneNumbers({
      areaCode,
      country,
      contains,
      locality,
      region,
      postalCode,
      limit,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to search phone numbers' },
        { status: 500 }
      )
    }

    // Format numbers for frontend
    const formattedNumbers = result.numbers?.map((num) => ({
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      region: num.region,
      locality: num.locality,
      postalCode: num.postalCode,
      areaCode: num.phoneNumber.substring(2, 5), // Extract area code from +1XXXXXXXXXX
      capabilities: num.capabilities,
      // Add your pricing logic here
      priceCents: 100, // Base price in cents (you can adjust based on region, etc.)
    }))

    return NextResponse.json({ numbers: formattedNumbers || [] })
  } catch (error: any) {
    console.error('[Phone Number Search] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

