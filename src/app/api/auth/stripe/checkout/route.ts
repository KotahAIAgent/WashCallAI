import { createServerClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PLANS } from '@/lib/stripe/server'
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
      .select('*')
      .eq('id', profile.organization_id)
      .single() as { data: { id: string; billing_customer_id: string | null } | null }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    const body = await request.json()
    const { planId, isTrialConversion } = body

    if (!planId || !['starter', 'growth', 'pro'].includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const plan = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS]

    // Get or create Stripe customer
    let customerId = organization.billing_customer_id

    if (!customerId) {
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
    }

    // Check if user is converting from a trial
    const { data: orgData } = await supabase
      .from('organizations')
      .select('trial_plan, trial_ends_at')
      .eq('id', organization.id)
      .single()

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

    return NextResponse.json({ 
      success: true, 
      url: checkoutSession.url 
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

