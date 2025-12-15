'use server'

import { createActionClient, createServiceRoleClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { revalidatePath } from 'next/cache'

export async function getAvailablePhoneNumbers(filters?: {
  areaCode?: string
  state?: string
  city?: string
}) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated', phoneNumbers: [] }
  }

  let query = supabase
    .from('phone_number_catalog')
    .select('*')
    .eq('available', true)
    .order('area_code', { ascending: true })
    .order('phone_number', { ascending: true })

  if (filters?.areaCode) {
    query = query.eq('area_code', filters.areaCode)
  }
  if (filters?.state) {
    query = query.eq('state', filters.state)
  }
  if (filters?.city) {
    query = query.ilike('city', `%${filters.city}%`)
  }

  const { data: phoneNumbers, error } = await query

  if (error) {
    return { error: error.message, phoneNumbers: [] }
  }

  return { phoneNumbers: phoneNumbers || [] }
}

export async function createPhoneNumberCheckout(phoneNumberId: string, organizationId: string) {
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
    .eq('organization_id', organizationId)
    .single()

  if (!member) {
    return { error: 'Unauthorized' }
  }

  // Get phone number details
  const { data: phoneNumber, error: phoneError } = await supabase
    .from('phone_number_catalog')
    .select('*')
    .eq('id', phoneNumberId)
    .eq('available', true)
    .single()

  if (phoneError || !phoneNumber) {
    return { error: 'Phone number not available' }
  }

  // Get organization billing customer ID
  const { data: organization } = await supabase
    .from('organizations')
    .select('billing_customer_id, name')
    .eq('id', organizationId)
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
          organization_id: organizationId,
        },
      })
      customerId = customer.id

      // Update organization with customer ID
      await supabase
        .from('organizations')
        .update({ billing_customer_id: customerId })
        .eq('id', organizationId)
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Phone Number: ${phoneNumber.phone_number}`,
              description: `Purchase phone number ${phoneNumber.phone_number}${phoneNumber.area_code ? ` (${phoneNumber.area_code})` : ''}${phoneNumber.state ? ` in ${phoneNumber.state}` : ''}`,
            },
            unit_amount: phoneNumber.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/phone-numbers?purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/phone-numbers?canceled=true`,
      metadata: {
        organization_id: organizationId,
        phone_number_id: phoneNumberId,
        phone_number: phoneNumber.phone_number,
      },
    })

    // Create pending purchase record
    const serviceSupabase = createServiceRoleClient()
    await serviceSupabase
      .from('phone_number_purchases')
      .insert({
        organization_id: organizationId,
        phone_number_id: phoneNumberId,
        stripe_payment_intent_id: checkoutSession.payment_intent as string | undefined,
        amount_paid_cents: phoneNumber.price_cents,
        status: 'pending',
      })

    return { url: checkoutSession.url }
  } catch (error: any) {
    console.error('[createPhoneNumberCheckout] Error:', error)
    return { error: error.message || 'Failed to create checkout session' }
  }
}

