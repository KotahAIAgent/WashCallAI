import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !stripe) {
    return NextResponse.json({ error: 'Missing signature or Stripe not configured' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    // Handle checkout session completed (when customer completes payment)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const organizationId = session.metadata?.organization_id
      const plan = session.metadata?.plan as string

      if (organizationId && plan) {
        // Get subscription from session
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription?.id

        if (subscriptionId) {
          // Fetch subscription to get full details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          // Update organization with plan and subscription start date
          await supabase
            .from('organizations')
            .update({
              plan: plan,
              subscription_started_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', organizationId)

          console.log(`✓ Checkout completed for org ${organizationId}: plan=${plan}`)
        }
      }
    }

    // Handle subscription created/updated
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const organizationId = subscription.metadata?.organization_id
      const plan = subscription.metadata?.plan as string

      if (organizationId && plan) {
        // Check if subscription_started_at is already set (to avoid overwriting)
        const { data: org } = await supabase
          .from('organizations')
          .select('subscription_started_at, plan')
          .eq('id', organizationId)
          .single()

        // Only set subscription_started_at if:
        // 1. It's not already set, OR
        // 2. The plan is changing (upgrade/downgrade)
        const shouldSetStartDate = !org?.subscription_started_at || org.plan !== plan

        const updateData: any = {
          plan: plan,
          updated_at: new Date().toISOString(),
        }

        if (shouldSetStartDate) {
          updateData.subscription_started_at = new Date().toISOString()
        }

        await supabase
          .from('organizations')
          .update(updateData)
          .eq('id', organizationId)

        console.log(`✓ Updated subscription for org ${organizationId}: plan=${plan}`)
      }
    }

    // Handle invoice payment succeeded (apply credits if any)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

      if (customerId) {
        // Get organization by customer ID
        const { data: org } = await supabase
          .from('organizations')
          .select('id, account_credit')
          .eq('billing_customer_id', customerId)
          .single()

        if (org && org.account_credit > 0) {
          // Apply credit to invoice (Stripe will handle this automatically via customer balance)
          // But we should track it in our system
          console.log(`Account credit available for org ${org.id}: $${(org.account_credit / 100).toFixed(2)}`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

