import { createServerClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe/server'
import { NextResponse } from 'next/server'
import { isStarterPlanBlocked } from '@/lib/admin/utils'

export async function POST(request: Request) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      console.error('[Checkout] Stripe is not configured - STRIPE_SECRET_KEY is missing')
      return NextResponse.json(
        { error: 'Payment system is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[Checkout] Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile', details: profileError.message },
        { status: 500 }
      )
    }

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .maybeSingle()

    if (orgError) {
      console.error('[Checkout] Error fetching organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to fetch organization', details: orgError.message },
        { status: 500 }
      )
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const { planId, isTrialConversion } = body

    if (!planId || !['starter', 'growth', 'pro'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Check if starter plan is blocked
    if (planId === 'starter' && isStarterPlanBlocked(organization)) {
      return NextResponse.json({ 
        error: 'Starter plan access has been restricted for this organization. Please contact support or choose a different plan.' 
      }, { status: 403 })
    }

    const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS]

    // Validate plan configuration
    if (!plan) {
      console.error(`[Checkout] Plan not found: ${planId}`)
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 })
    }

    if (!plan.priceId || plan.priceId.includes('_test') && !process.env.STRIPE_STARTER_PRICE_ID) {
      console.error(`[Checkout] Plan price ID not configured: ${planId} - ${plan.priceId}`)
      return NextResponse.json(
        { error: 'Plan pricing is not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Get or create Stripe customer
    let customerId = organization.billing_customer_id

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: session.user.email || undefined,
          metadata: {
            organization_id: organization.id,
          },
        })
        customerId = customer.id

        // Update organization with customer ID
        await (supabase
          .from('organizations') as any)
          .update({ billing_customer_id: customerId })
          .eq('id', organization.id)
        
        console.log(`[Checkout] Created Stripe customer: ${customerId} for org ${organization.id}`)
      } catch (error: any) {
        console.error('[Checkout] Error creating Stripe customer:', error)
        return NextResponse.json(
          { error: `Failed to create customer: ${error.message || 'Unknown error'}` },
          { status: 500 }
        )
      }
    }

    // Check if user is converting from a trial
    const { data: orgData, error: orgDataError } = await supabase
      .from('organizations')
      .select('trial_plan, trial_ends_at')
      .eq('id', organization.id)
      .maybeSingle()

    if (orgDataError) {
      console.error('[Checkout] Error fetching trial data:', orgDataError)
      // Continue anyway - trial conversion is optional
    }

    const isConvertingFromTrial = isTrialConversion || (orgData?.trial_ends_at && new Date(orgData.trial_ends_at) > new Date())
    const trialPlan = orgData?.trial_plan as string | null

    // Skip setup fee ONLY if:
    // 1. User is converting from Starter trial to Starter plan
    // Growth and Pro always require setup fee (no free trials for outbound features)
    const skipSetupFee = isConvertingFromTrial && 
      trialPlan === 'starter' && 
      planId === 'starter'

    // Add setup fee as an invoice item that will be charged with the first invoice
    // Skip if converting from Growth/Pro trial to same plan
    if (!skipSetupFee && plan.setupFee > 0 && plan.setupFeePriceId) {
      try {
        await stripe.invoiceItems.create({
          customer: customerId,
          price: plan.setupFeePriceId,
          description: `One-time setup fee for ${plan.name} plan - Includes CRM & Calendar integration`,
          metadata: {
            organization_id: organization.id,
            plan: planId,
            setup_fee: 'true',
          },
        })
      } catch (error) {
        console.error('Error creating setup fee invoice item:', error)
        // Continue anyway - setup fee can be added later via webhook if needed
      }
    }

    // Create checkout session with subscription
    // The setup fee invoice item will be included in the first invoice
    try {
      console.log(`[Checkout] Creating checkout session for plan: ${planId}, priceId: ${plan.priceId}`)
      
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          metadata: {
            organization_id: organization.id,
            plan: planId,
            setup_fee_amount: plan.setupFee.toString(),
          },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings?canceled=true`,
        metadata: {
          organization_id: organization.id,
          plan: planId,
          setup_fee_amount: plan.setupFee.toString(),
        },
      })

      console.log(`[Checkout] ✅ Checkout session created: ${checkoutSession.id}`)

      return NextResponse.json({ 
        success: true, 
        url: checkoutSession.url 
      })
    } catch (stripeError: any) {
      console.error('[Checkout] Stripe API error:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        planId,
        priceId: plan.priceId,
      })
      
      // Provide more helpful error messages
      if (stripeError.code === 'resource_missing') {
        return NextResponse.json(
          { error: `Price ID not found in Stripe. Please verify ${planId} plan is configured correctly.` },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: `Payment error: ${stripeError.message || 'Failed to create checkout session'}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Checkout] Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

