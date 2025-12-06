import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Cron job to check for expired trials and disable services
 * Should be called periodically (e.g., every hour)
 * 
 * POST /api/cron/check-trials
 * 
 * Set up with Vercel Cron or external cron service:
 * vercel.json: { "crons": [{ "path": "/api/cron/check-trials", "schedule": "0 * * * *" }] }
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const now = new Date().toISOString()

    // Find organizations with expired trials that haven't been processed
    const { data: expiredOrgs, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, email, trial_ends_at, setup_status')
      .is('plan', null) // No paid plan
      .lt('trial_ends_at', now) // Trial has ended
      .eq('setup_status', 'active') // Still marked as active

    if (fetchError) {
      console.error('Error fetching expired trials:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!expiredOrgs || expiredOrgs.length === 0) {
      return NextResponse.json({ 
        message: 'No expired trials to process',
        processed: 0 
      })
    }

    console.log(`Found ${expiredOrgs.length} expired trials to process`)

    let processed = 0
    let errors = 0

    for (const org of expiredOrgs) {
      try {
        // Disable agent configs
        await (supabase
          .from('agent_configs') as any)
          .update({
            inbound_enabled: false,
            outbound_enabled: false,
            updated_at: now,
          })
          .eq('organization_id', org.id)

        // Pause active campaigns
        await (supabase
          .from('campaigns') as any)
          .update({ status: 'paused' })
          .eq('organization_id', org.id)
          .eq('status', 'active')

        // Update organization status
        await (supabase
          .from('organizations') as any)
          .update({ 
            setup_status: 'ready' // Ready but not active
          })
          .eq('id', org.id)

        // Create a notification for the user
        await supabase.from('notifications').insert({
          organization_id: org.id,
          type: 'system',
          title: '⚠️ Your Trial Has Expired',
          message: 'Your 15-day free trial has ended. Subscribe now to keep your AI agents running and never miss a lead!',
          link: '/app/pricing',
        })

        console.log(`✓ Disabled services for org: ${org.name} (${org.id})`)
        processed++

        // TODO: Send email notification about trial expiration
        // await sendTrialExpiredEmail(org.email, org.name)

      } catch (err) {
        console.error(`Error processing org ${org.id}:`, err)
        errors++
      }
    }

    return NextResponse.json({
      message: `Processed ${processed} expired trials`,
      processed,
      errors,
      total: expiredOrgs.length,
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also allow GET for easy testing
export async function GET(request: Request) {
  return POST(request)
}

