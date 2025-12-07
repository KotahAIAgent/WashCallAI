import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single() as { data: { organization_id: string } | null }

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('billing_customer_id, trial_ends_at, plan, setup_fee_refunded')
      .eq('id', profile.organization_id)
      .single() as { data: { billing_customer_id: string | null; trial_ends_at: string | null; plan: string | null; setup_fee_refunded: boolean } | null }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Check if user is within trial period
    const now = new Date()
    const trialEndsAt = organization.trial_ends_at ? new Date(organization.trial_ends_at) : null
    const isOnTrial = trialEndsAt && now < trialEndsAt

    if (!isOnTrial) {
      return NextResponse.json({ 
        error: 'Not eligible for refund. Trial period has ended or no active trial.' 
      }, { status: 400 })
    }

    if (!organization.billing_customer_id) {
      return NextResponse.json({ 
        error: 'No billing customer found. Setup fee may not have been charged.' 
      }, { status: 400 })
    }

    // Check if already refunded (from database)
    if (organization.setup_fee_refunded) {
      return NextResponse.json({ 
        error: 'Setup fee has already been refunded.' 
      }, { status: 400 })
    }

    // Find the setup fee payment
    // Look for invoice items with setup_fee metadata
    const customerId = organization.billing_customer_id
    
    // Get all invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    })

    // Find the setup fee charge
    let setupFeePaymentIntentId: string | null = null
    let setupFeeAmount = 0

    for (const invoice of invoices.data) {
      // Check invoice items for setup fee
      if (invoice.lines.data) {
        for (const line of invoice.lines.data) {
          if (line.metadata?.setup_fee === 'true') {
            // Found setup fee - get the payment intent
            if (invoice.payment_intent && typeof invoice.payment_intent === 'string') {
              setupFeePaymentIntentId = invoice.payment_intent
              setupFeeAmount = line.amount || 0
              break
            } else if (typeof invoice.payment_intent === 'object' && invoice.payment_intent?.id) {
              setupFeePaymentIntentId = invoice.payment_intent.id
              setupFeeAmount = line.amount || 0
              break
            }
          }
        }
      }
    }

    // If not found in invoices, check payment intents directly
    if (!setupFeePaymentIntentId) {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
      })

      for (const pi of paymentIntents.data) {
        if (pi.metadata?.setup_fee === 'true') {
          setupFeePaymentIntentId = pi.id
          setupFeeAmount = pi.amount
          break
        }
      }
    }

    if (!setupFeePaymentIntentId) {
      return NextResponse.json({ 
        error: 'Setup fee payment not found. It may have already been refunded or not charged yet.' 
      }, { status: 404 })
    }

    // Process the refund
    const refund = await stripe.refunds.create({
      payment_intent: setupFeePaymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        organization_id: profile.organization_id,
        reason: 'trial_cancellation',
      },
    })

    // Update organization to track refund
    await supabase
      .from('organizations')
      .update({
        setup_fee_refunded: true,
        setup_fee_refunded_at: new Date().toISOString(),
      })
      .eq('id', profile.organization_id)

    return NextResponse.json({ 
      success: true,
      refund_id: refund.id,
      amount: refund.amount,
      message: 'Setup fee has been refunded successfully.',
    })
  } catch (error: any) {
    console.error('Stripe refund error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

