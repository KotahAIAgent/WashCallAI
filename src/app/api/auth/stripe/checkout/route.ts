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
    const { planId } = body

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
      await supabase
        .from('organizations')
        .update({ billing_customer_id: customerId })
        .eq('id', organization.id)
    }

    // Create checkout session
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings?canceled=true`,
      metadata: {
        organization_id: organization.id,
        plan: planId,
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

