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
    // Handle subscription created/updated
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const organizationId = subscription.metadata?.organization_id
      const plan = subscription.metadata?.plan as string

      if (organizationId && plan) {
        // Only update if subscription is active
        if (subscription.status === 'active' || subscription.status === 'trialing') {
        // Check if subscription_started_at is already set (to avoid overwriting)
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('subscription_started_at, plan')
          .eq('id', organizationId)
          .maybeSingle()

        if (orgError) {
          console.error(`[Webhook] Error fetching org for subscription_started_at:`, orgError)
          // Continue anyway - not critical
        }

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

        // Auto-approve setup status when subscription is created/activated
        // This makes the system fully hands-off - clients can self-serve
        const { data: currentOrg, error: currentOrgError } = await supabase
          .from('organizations')
          .select('setup_status, onboarding_completed')
          .eq('id', organizationId)
          .maybeSingle()

        if (currentOrgError) {
          console.error(`[Webhook] Error fetching org for setup_status:`, currentOrgError)
          // Continue anyway - not critical
        }

        // Only auto-approve if onboarding is completed and status is not already active
        if (currentOrg?.onboarding_completed && currentOrg?.setup_status !== 'active') {
          updateData.setup_status = 'active'
          console.log(`✓ Auto-approved setup status for org ${organizationId} (subscription activated)`)
        }

        await supabase
          .from('organizations')
          .update(updateData)
          .eq('id', organizationId)

          console.log(`✓ Updated subscription for org ${organizationId}: plan=${plan}, status=${subscription.status}`)
        } else {
          // Subscription is not active, clear the plan
          await supabase
            .from('organizations')
            .update({
              plan: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', organizationId)

          console.log(`✓ Cleared plan for org ${organizationId} (subscription status: ${subscription.status})`)
        }
      }
    }

    // Handle subscription deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const organizationId = subscription.metadata?.organization_id

      if (organizationId) {
        await supabase
          .from('organizations')
          .update({
            plan: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationId)

        console.log(`✓ Cleared plan for org ${organizationId} (subscription deleted)`)
      }
    }

    // Handle subscription updated (check if status changed to canceled)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const organizationId = subscription.metadata?.organization_id

      // If subscription is canceled or past_due, clear the plan
      if (organizationId && (subscription.status === 'canceled' || subscription.status === 'past_due' || subscription.status === 'unpaid')) {
        await supabase
          .from('organizations')
          .update({
            plan: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationId)

        console.log(`✓ Cleared plan for org ${organizationId} (subscription status: ${subscription.status})`)
      }
    }

    // Handle invoice payment succeeded (apply credits if any)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id

      if (customerId) {
        // Get organization by customer ID
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, account_credit')
          .eq('billing_customer_id', customerId)
          .maybeSingle()

        if (orgError) {
          console.error(`[Webhook] Error fetching org by customer ID:`, orgError)
          // Continue anyway - not critical for invoice events
        }

        if (org && org.account_credit > 0) {
          // Apply credit to invoice (Stripe will handle this automatically via customer balance)
          // But we should track it in our system
          console.log(`Account credit available for org ${org.id}: $${(org.account_credit / 100).toFixed(2)}`)
        }
      }
    }

    // Handle credits purchase (checkout.session.completed)
    if (event.type === 'checkout.session.completed') {
      console.log('[Webhook] checkout.session.completed event received')
      const session = event.data.object as Stripe.Checkout.Session
      const purchaseType = session.metadata?.purchase_type
      const organizationId = session.metadata?.organization_id
      const minutes = session.metadata?.minutes

      console.log('[Webhook] Session metadata:', {
        purchaseType,
        organizationId,
        minutes,
        fullMetadata: session.metadata,
      })

      if (purchaseType === 'credits' && organizationId && minutes) {
        const minutesToAdd = parseInt(minutes, 10)
        console.log(`[Webhook] Processing credits purchase: ${minutesToAdd} minutes for org ${organizationId}`)
        
        if (minutesToAdd > 0) {
          // Get current credits
          const { data: org, error: fetchError } = await supabase
            .from('organizations')
            .select('purchased_credits_minutes')
            .eq('id', organizationId)
            .maybeSingle()

          if (fetchError) {
            console.error(`[Webhook] Error fetching organization ${organizationId}:`, {
              error: fetchError,
              code: fetchError.code,
              message: fetchError.message,
              details: fetchError.details,
              hint: fetchError.hint,
            })
            
            // Check if it's a column missing error
            if (fetchError.message?.includes('column') || fetchError.message?.includes('does not exist')) {
              console.error(`[Webhook] ⚠️ Database column missing! Run migration: add-credits-to-organizations.sql`)
              return NextResponse.json({ 
                error: 'Database column missing. Please run the migration to add purchased_credits_minutes column.',
                details: fetchError.message 
              }, { status: 500 })
            }
            
            return NextResponse.json({ 
              error: 'Failed to fetch organization',
              details: fetchError.message 
            }, { status: 500 })
          }

          if (!org) {
            console.error(`[Webhook] Organization not found: ${organizationId}`)
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
          }

          const currentCredits = org.purchased_credits_minutes || 0
          const newCredits = currentCredits + minutesToAdd

          console.log(`[Webhook] Current credits: ${currentCredits}, Adding: ${minutesToAdd}, New total: ${newCredits}`)

          // Add credits to organization
          const { error: updateError } = await supabase
            .from('organizations')
            .update({
              purchased_credits_minutes: newCredits,
              updated_at: new Date().toISOString(),
            })
            .eq('id', organizationId)

          if (updateError) {
            console.error(`[Webhook] Error updating credits for org ${organizationId}:`, updateError)
            return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
          }

          console.log(`[Webhook] ✓ Successfully added ${minutesToAdd} credits to org ${organizationId} (total: ${newCredits})`)
        } else {
          console.warn(`[Webhook] Invalid minutes amount: ${minutesToAdd}`)
        }
      } else {
        console.log('[Webhook] Not a credits purchase or missing metadata:', {
          purchaseType,
          hasOrgId: !!organizationId,
          hasMinutes: !!minutes,
        })
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

