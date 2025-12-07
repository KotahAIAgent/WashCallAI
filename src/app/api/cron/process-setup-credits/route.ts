import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { STRIPE_PLANS } from '@/lib/stripe/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerClient()
    const now = new Date()
    // 6 months = approximately 180 days
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    // Find organizations that:
    // 1. Have been subscribed for 6+ months
    // 2. Haven't received the credit yet
    // 3. Have a paid plan
    const { data: eligibleOrgs, error } = await supabase
      .from('organizations')
      .select('id, plan, subscription_started_at, setup_fee_credited, account_credit, billing_customer_id')
      .not('plan', 'is', null)
      .lte('subscription_started_at', sixMonthsAgo.toISOString())
      .eq('setup_fee_credited', false)

    if (error) {
      console.error('Error fetching eligible organizations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!eligibleOrgs || eligibleOrgs.length === 0) {
      return NextResponse.json({ 
        message: 'No organizations eligible for setup fee credit',
        processed: 0 
      })
    }

    let processed = 0
    let errors = 0

    for (const org of eligibleOrgs) {
      try {
        const plan = org.plan as keyof typeof STRIPE_PLANS
        if (!plan || !STRIPE_PLANS[plan]) {
          console.log(`Skipping org ${org.id}: invalid plan`)
          continue
        }

        const setupFee = STRIPE_PLANS[plan].setupFee
        const creditAmount = setupFee * 100 // Convert to cents

        // Calculate new total credit
        const newCreditTotal = (org.account_credit || 0) + creditAmount

        // Update organization with credit
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            account_credit: newCreditTotal,
            setup_fee_credited: true,
            setup_fee_credited_at: now.toISOString(),
          })
          .eq('id', org.id)

        if (updateError) {
          console.error(`Error updating org ${org.id}:`, updateError)
          errors++
          continue
        }

        // Update Stripe customer balance (negative = credit)
        // Stripe will automatically apply this credit to the next invoice
        if (org.billing_customer_id && stripe) {
          try {
            await stripe.customers.update(org.billing_customer_id, {
              balance: -newCreditTotal, // Negative = credit to customer
              metadata: {
                last_credit_applied: now.toISOString(),
                credit_type: 'setup_fee_6_month',
                credit_amount: creditAmount.toString(),
              },
            })
            console.log(`✓ Updated Stripe balance for customer ${org.billing_customer_id}: -$${(newCreditTotal / 100).toFixed(2)}`)
          } catch (stripeError: any) {
            console.error(`Stripe error for org ${org.id}:`, stripeError.message)
            // Continue anyway - credit is in database and can be applied manually if needed
            // The credit will still work, just won't be in Stripe's system automatically
          }
        }

        // Create notification
        await supabase.from('notifications').insert({
          organization_id: org.id,
          type: 'system',
          title: '🎉 Setup Fee Credit Applied!',
          message: `Thank you for 6 months of loyalty! We've credited $${setupFee} to your account. This will automatically apply to your next invoice.`,
          link: '/app/settings',
        })

        processed++
        console.log(`✓ Credited $${setupFee} to org: ${org.id}`)

      } catch (err) {
        console.error(`Error processing org ${org.id}:`, err)
        errors++
      }
    }

    return NextResponse.json({
      message: `Processed ${processed} setup fee credits`,
      processed,
      errors,
      total: eligibleOrgs.length,
    })

  } catch (error: any) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also allow GET for easy testing
export async function GET(request: Request) {
  return POST(request)
}

