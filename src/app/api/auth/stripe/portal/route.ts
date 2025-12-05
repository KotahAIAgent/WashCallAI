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
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('billing_customer_id')
      .eq('id', profile.organization_id)
      .single()

    if (!organization?.billing_customer_id) {
      return NextResponse.json({ error: 'No billing customer found' }, { status: 400 })
    }

    // Create Stripe customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: organization.billing_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/settings`,
    })

    return NextResponse.json({ 
      success: true, 
      url: portalSession.url 
    })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

