'use server'

import { createActionClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

interface CreateTwilioPhoneCheckoutParams {
  phoneNumber: string
  organizationId: string
  priceCents: number
  areaCode?: string
  locality?: string
  region?: string
}

/**
 * Create Stripe checkout for purchasing a phone number directly from Twilio
 */
export async function createTwilioPhoneCheckout(params: CreateTwilioPhoneCheckoutParams) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Verify user has access to this organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('profile_id', session.user.id)
    .eq('organization_id', params.organizationId)
    .single()

  if (!member) {
    return { error: 'Unauthorized' }
  }

  // Get organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('billing_customer_id, name')
    .eq('id', params.organizationId)
    .single()

  if (!organization) {
    return { error: 'Organization not found' }
  }

  if (!stripe) {
    return { error: 'Payment system not configured' }
  }

  try {
    // Get or create Stripe customer
    let customerId = organization.billing_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: organization.name,
        metadata: {
          organization_id: params.organizationId,
        },
      })
      customerId = customer.id

      await supabase
        .from('organizations')
        .update({ billing_customer_id: customerId })
        .eq('id', params.organizationId)
    }

    // Create checkout session
    const description = `Phone number ${params.phoneNumber}${params.areaCode ? ` (${params.areaCode})` : ''}${params.locality ? ` in ${params.locality}` : ''}${params.region ? `, ${params.region}` : ''}`

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Phone Number: ${params.phoneNumber}`,
              description: description,
            },
            unit_amount: params.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/phone-numbers?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/phone-numbers?canceled=true`,
      metadata: {
        organization_id: params.organizationId,
        phone_number: params.phoneNumber,
        twilio_direct: 'true', // Flag to indicate this is a direct Twilio purchase
        area_code: params.areaCode || '',
        locality: params.locality || '',
        region: params.region || '',
      },
    })

    return { url: checkoutSession.url }
  } catch (error: any) {
    console.error('[createTwilioPhoneCheckout] Error:', error)
    return { error: error.message || 'Failed to create checkout session' }
  }
}

