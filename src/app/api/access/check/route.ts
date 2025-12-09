import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * API endpoint to check if an organization has active access
 * This can be called by external services (like Vapi) to verify access before forwarding calls
 * 
 * GET /api/access/check?phone=+1234567890
 * GET /api/access/check?org_id=uuid
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const orgId = searchParams.get('org_id')

    if (!phone && !orgId) {
      return NextResponse.json({ 
        error: 'Missing phone or org_id parameter' 
      }, { status: 400 })
    }

    const supabase = createServerClient()
    let organizationId: string | null = orgId

    // If phone provided, look up organization
    if (phone && !organizationId) {
      const { data: phoneNumber } = await supabase
        .from('phone_numbers')
        .select('organization_id')
        .eq('phone_number', phone)
        .single() as { data: { organization_id: string } | null }

      if (phoneNumber) {
        organizationId = phoneNumber.organization_id
      }
    }

    if (!organizationId) {
      return NextResponse.json({
        allowed: false,
        reason: 'Organization not found',
      })
    }

    // Check organization access
    const { data: org } = await supabase
      .from('organizations')
      .select('plan, trial_ends_at, name')
      .eq('id', organizationId)
      .single() as { data: { plan: string | null; trial_ends_at: string | null; name: string } | null }

    if (!org) {
      return NextResponse.json({
        allowed: false,
        reason: 'Organization not found',
      })
    }

    // Has paid plan
    if (org.plan) {
      return NextResponse.json({
        allowed: true,
        reason: 'active_plan',
        plan: org.plan,
        organization: org.name,
      })
    }

    // Check trial
    if (org.trial_ends_at) {
      const trialEndsAt = new Date(org.trial_ends_at)
      const now = new Date()

      if (now < trialEndsAt) {
        const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return NextResponse.json({
          allowed: true,
          reason: 'active_trial',
          daysRemaining,
          trialEndsAt: org.trial_ends_at,
          organization: org.name,
        })
      } else {
        return NextResponse.json({
          allowed: false,
          reason: 'trial_expired',
          trialEndedAt: org.trial_ends_at,
          organization: org.name,
          message: 'Trial has expired. Please subscribe to continue.',
        })
      }
    }

    return NextResponse.json({
      allowed: false,
      reason: 'no_subscription',
      organization: org.name,
      message: 'No active subscription or trial.',
    })

  } catch (error) {
    console.error('Access check error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

