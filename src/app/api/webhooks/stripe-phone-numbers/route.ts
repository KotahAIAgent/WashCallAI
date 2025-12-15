import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !stripe) {
    return NextResponse.json({ error: 'Missing signature or Stripe not configured' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_PHONE_NUMBERS || process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[Phone Number Webhook] STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[Phone Number Webhook] Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Handle checkout.session.completed for one-time payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any

    // Only process phone number purchases (check metadata)
    if (!session.metadata?.phone_number_id || !session.metadata?.organization_id) {
      console.log('[Phone Number Webhook] Not a phone number purchase, skipping')
      return NextResponse.json({ received: true })
    }

    const { phone_number_id, organization_id, phone_number } = session.metadata

    try {
      // Update purchase status
      const { data: purchase, error: purchaseError } = await supabase
        .from('phone_number_purchases')
        .update({
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent,
          stripe_invoice_id: session.invoice,
          purchased_at: new Date().toISOString(),
        })
        .eq('phone_number_id', phone_number_id)
        .eq('organization_id', organization_id)
        .select()
        .single()

      if (purchaseError) {
        console.error('[Phone Number Webhook] Failed to update purchase:', purchaseError)
        return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 })
      }

      // Mark phone number as unavailable in catalog
      await supabase
        .from('phone_number_catalog')
        .update({
          available: false,
          purchased_by_organization_id: organization_id,
          purchased_at: new Date().toISOString(),
        })
        .eq('id', phone_number_id)

      // Get phone number details from catalog
      const { data: catalogPhone } = await supabase
        .from('phone_number_catalog')
        .select('*')
        .eq('id', phone_number_id)
        .single()

      if (!catalogPhone) {
        console.error('[Phone Number Webhook] Phone number not found in catalog')
        return NextResponse.json({ error: 'Phone number not found' }, { status: 500 })
      }

      // Add phone number to organization's phone_numbers table
      const { error: addError } = await supabase
        .from('phone_numbers')
        .insert({
          organization_id: organization_id,
          phone_number: catalogPhone.phone_number,
          provider_phone_id: catalogPhone.provider_phone_id,
          friendly_name: `Purchased Number ${phone_number}`,
          type: 'both', // Default to both inbound and outbound
          active: true,
        })

      if (addError) {
        console.error('[Phone Number Webhook] Failed to add phone number to organization:', addError)
        // Don't fail the webhook - the purchase was successful
      }

      console.log('[Phone Number Webhook] ✅ Phone number purchase completed:', {
        organization_id,
        phone_number_id,
        phone_number,
      })

      return NextResponse.json({ received: true })
    } catch (error: any) {
      console.error('[Phone Number Webhook] Error processing purchase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}

