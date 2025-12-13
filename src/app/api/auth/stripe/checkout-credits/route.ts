import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { NextResponse } from 'next/server'

/**
 * Create Stripe checkout session for purchasing credits
 * Credits are $0.30 per minute
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { minutes } = body

    if (!minutes || minutes < 1) {
      return NextResponse.json(
        { error: 'Invalid minutes amount' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

    // Get organization billing customer ID
    const { data: org } = await supabase
      .from('organizations')
      .select('billing_customer_id, name')
      .eq('id', profile.organization_id)
      .single()

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 400 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    // Calculate price: $0.30 per minute
    const pricePerMinute = 0.30
    const totalAmount = minutes * pricePerMinute
    const amountInCents = Math.round(totalAmount * 100)

    // Create or get Stripe customer
    let customerId = org.billing_customer_id

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: org.name || undefined,
        metadata: {
          organization_id: profile.organization_id,
        },
      })
      customerId = customer.id

      // Save customer ID to organization
      await supabase
        .from('organizations')
        .update({ billing_customer_id: customerId })
        .eq('id', profile.organization_id)
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${minutes} Minutes Credit`,
              description: `Purchase ${minutes} minutes of call credits. Credits never expire and are used after your monthly plan minutes are exhausted.`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        organization_id: profile.organization_id,
        purchase_type: 'credits',
        minutes: minutes.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.fusioncaller.com'}/app/disputes?credits_purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.fusioncaller.com'}/app/disputes?canceled=true`,
    })

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (error: any) {
    console.error('Stripe credits checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

