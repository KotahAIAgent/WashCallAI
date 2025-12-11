import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isStarterPlanBlocked } from '@/lib/admin/utils'
import { stripe } from '@/lib/stripe/server'

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
      .select('plan, trial_ends_at, name, admin_granted_plan, admin_granted_plan_expires_at, admin_privileges, billing_customer_id')
      .eq('id', organizationId)
      .single() as { data: { 
        plan: string | null
        trial_ends_at: string | null
        name: string
        admin_granted_plan: string | null
        admin_granted_plan_expires_at: string | null
        admin_privileges: any
        billing_customer_id: string | null
      } | null }

    if (!org) {
      return NextResponse.json({
        allowed: false,
        reason: 'Organization not found',
      })
    }

    // Check for admin-granted privileges that bypass access checks
    const privileges = org.admin_privileges || {}
    if (privileges.bypass_limits === true) {
      return NextResponse.json({
        allowed: true,
        reason: 'admin_privilege_bypass',
        organization: org.name,
        plan: 'admin_privilege',
      })
    }

    // Check admin-granted plan (overrides regular plan)
    if (org.admin_granted_plan) {
      const expiresAt = org.admin_granted_plan_expires_at
        ? new Date(org.admin_granted_plan_expires_at)
        : null

      // If no expiration or not expired, admin-granted plan is active
      if (!expiresAt || expiresAt > new Date()) {
        return NextResponse.json({
          allowed: true,
          reason: 'admin_granted_plan',
          plan: org.admin_granted_plan,
          organization: org.name,
          expiresAt: org.admin_granted_plan_expires_at,
        })
      }
    }

    // Has paid plan - verify subscription is actually active in Stripe
    if (org.plan) {
      // Check if starter plan is blocked
      if (org.plan === 'starter' && isStarterPlanBlocked(org)) {
        return NextResponse.json({
          allowed: false,
          reason: 'starter_plan_blocked',
          organization: org.name,
          message: 'Starter plan access has been restricted for this organization.',
        })
      }

      // If we have a billing customer ID, verify the subscription is actually active
      if (org.billing_customer_id && stripe) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: org.billing_customer_id,
            status: 'active',
            limit: 1,
          })

          // If no active subscription found, clear the plan and deny access
          if (subscriptions.data.length === 0) {
            console.warn(`[access/check] Org ${organizationId} has plan ${org.plan} but no active Stripe subscription. Clearing plan.`)
            
            // Clear the plan asynchronously (don't wait for it)
            Promise.resolve(
              supabase
                .from('organizations')
                .update({ plan: null, updated_at: new Date().toISOString() })
                .eq('id', organizationId)
            )
              .then(() => {
                console.log(`✓ Cleared plan for org ${organizationId} (no active subscription)`)
              })
              .catch((err: any) => {
                console.error(`Error clearing plan for org ${organizationId}:`, err)
              })

            return NextResponse.json({
              allowed: false,
              reason: 'subscription_ended',
              organization: org.name,
              message: 'Your subscription has ended. Please renew to continue using the service.',
            })
          }
        } catch (error: any) {
          console.error(`[access/check] Error checking Stripe subscription for org ${organizationId}:`, error)
          // If Stripe check fails, still allow access (fail open) but log the error
          // This prevents service disruption if Stripe API is down
        }
      }
      
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

