import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { purchasePhoneNumber } from '@/lib/twilio/phone-numbers'

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
    // Support both catalog-based and direct Twilio purchases
    if (!session.metadata?.organization_id) {
      console.log('[Phone Number Webhook] Not a phone number purchase, skipping')
      return NextResponse.json({ received: true })
    }

    const { phone_number_id, organization_id, phone_number, twilio_direct } = session.metadata

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

      let finalPhoneNumber = phone_number
      let twilioSid: string | undefined
      let vapiPhoneId: string | undefined

      // If this is a direct Twilio purchase, purchase the number from Twilio
      if (twilio_direct === 'true') {
        console.log('[Phone Number Webhook] Purchasing phone number from Twilio:', phone_number)
        
        const twilioResult = await purchasePhoneNumber(phone_number, organization_id)
        
        if (!twilioResult.success || !twilioResult.number) {
          console.error('[Phone Number Webhook] Failed to purchase from Twilio:', twilioResult.error)
          // Note: Purchase still succeeded via Stripe, but Twilio purchase failed
          // You may want to refund or handle this differently
          return NextResponse.json({ 
            error: 'Failed to purchase phone number from Twilio',
            details: twilioResult.error 
          }, { status: 500 })
        }

        twilioSid = twilioResult.number.sid
        finalPhoneNumber = twilioResult.number.phoneNumber

        // Try to register with VAPI (optional - may not be needed if using Twilio directly)
        // VAPI can work with Twilio phone numbers using the Twilio SID
        console.log('[Phone Number Webhook] Phone number purchased from Twilio:', {
          phoneNumber: finalPhoneNumber,
          twilioSid: twilioSid,
        })
        // Note: VAPI registration may not be required - VAPI can use Twilio SIDs directly
        // We'll store the Twilio SID and let the assistant configuration handle VAPI setup
      } else {
        // Catalog-based purchase - get from catalog
        const { data: catalogPhone } = await supabase
          .from('phone_number_catalog')
          .select('*')
          .eq('id', phone_number_id)
          .single()

        if (!catalogPhone) {
          console.error('[Phone Number Webhook] Phone number not found in catalog')
          return NextResponse.json({ error: 'Phone number not found' }, { status: 500 })
        }

        twilioSid = catalogPhone.provider_phone_id || undefined
        finalPhoneNumber = catalogPhone.phone_number

        // Mark as unavailable in catalog
        await supabase
          .from('phone_number_catalog')
          .update({
            available: false,
            purchased_by_organization_id: organization_id,
            purchased_at: new Date().toISOString(),
          })
          .eq('id', phone_number_id)
      }

      // Add phone number to organization's phone_numbers table
      // Store Twilio SID as provider_phone_id (VAPI can use this)
      const { data: insertedPhone, error: addError } = await supabase
        .from('phone_numbers')
        .insert({
          organization_id: organization_id,
          phone_number: finalPhoneNumber,
          provider_phone_id: twilioSid || undefined, // Store Twilio SID
          friendly_name: `Purchased Number ${finalPhoneNumber}`,
          type: 'both', // Default to both inbound and outbound
          active: true,
        })
        .select()
        .single()

      if (addError) {
        console.error('[Phone Number Webhook] Failed to add phone number to organization:', addError)
        // Don't fail the webhook - the purchase was successful
      } else {
        console.log('[Phone Number Webhook] ✅ Phone number added to organization')

        // Optional: Auto-assign to assistant if organization has one configured
        // Get organization's agent config
        const { data: agentConfig } = await supabase
          .from('agent_configs')
          .select('inbound_agent_id, inbound_enabled')
          .eq('organization_id', organization_id)
          .single()

        // If they have an inbound assistant and it's enabled, we could auto-assign
        // For now, we'll just add the number - user can assign manually via UI
        // This keeps the flow simpler and more predictable
      }

      if (addError) {
        console.error('[Phone Number Webhook] Failed to add phone number to organization:', addError)
        // Don't fail the webhook - the purchase was successful
      } else {
        console.log('[Phone Number Webhook] ✅ Phone number added to organization')
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

