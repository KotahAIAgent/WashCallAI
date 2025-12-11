import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { isStarterPlanBlocked } from '@/lib/admin/utils'

/**
 * Pre-call access check endpoint for Vapi
 * This is called by Vapi BEFORE connecting a call
 * If this returns an error, Vapi will reject the call
 * 
 * Vapi will call this with the call payload
 */
export const dynamic = 'force-dynamic'

// Normalize phone number to E.164 format for matching
function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (phone.startsWith('+')) {
    return phone
  }
  return phone
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    console.log('[Pre-Call Check] Received payload:', JSON.stringify(payload, null, 2))
    
    const supabase = createServiceRoleClient()
    
    // Extract identifiers from payload
    const assistantId = payload.assistantId || 
                       payload.assistant_id || 
                       payload.assistant?.id ||
                       payload.call?.assistantId
    const phoneNumberId = payload.phoneNumberId || 
                         payload.phoneNumber_id ||
                         payload.phone?.id ||
                         payload.call?.phoneNumberId
    const fromNumber = payload.from || payload.caller?.number
    const toNumber = payload.to || payload.callee?.number
    
    let organizationId: string | null = null
    
    // Try to find organization by assistant ID
    if (assistantId) {
      const { data: agentConfig } = await supabase
        .from('agent_configs')
        .select('organization_id')
        .or(`inbound_agent_id.eq.${assistantId},outbound_agent_id.eq.${assistantId}`)
        .maybeSingle()
      
      if (agentConfig) {
        organizationId = agentConfig.organization_id
        console.log('[Pre-Call Check] Found org by assistant ID:', organizationId)
      }
    }
    
    // If not found, try by phone number ID (provider_phone_id)
    if (!organizationId && phoneNumberId) {
      const { data: phoneNumber } = await supabase
        .from('phone_numbers')
        .select('organization_id')
        .eq('provider_phone_id', phoneNumberId)
        .maybeSingle()
      
      if (phoneNumber) {
        organizationId = phoneNumber.organization_id
        console.log('[Pre-Call Check] Found org by phone number ID:', organizationId)
      }
    }
    
    // If still not found, try by actual phone number (for inbound)
    if (!organizationId && toNumber) {
      // Try exact match first
      const { data: phoneNumber } = await supabase
        .from('phone_numbers')
        .select('organization_id')
        .eq('phone_number', toNumber)
        .maybeSingle()
      
      if (phoneNumber) {
        organizationId = phoneNumber.organization_id
        console.log('[Pre-Call Check] Found org by exact phone number:', organizationId)
      } else {
        // Try normalized version
        const normalized = normalizePhoneNumber(toNumber)
        if (normalized) {
          const { data: phoneNumberNormalized } = await supabase
            .from('phone_numbers')
            .select('organization_id')
            .eq('phone_number', normalized)
            .maybeSingle()
          
          if (phoneNumberNormalized) {
            organizationId = phoneNumberNormalized.organization_id
            console.log('[Pre-Call Check] Found org by normalized phone number:', organizationId)
          }
        }
      }
    }
    
    if (!organizationId) {
      console.error('[Pre-Call Check] ❌ Could not identify organization')
      return NextResponse.json(
        { 
          error: 'Organization not found',
          action: 'reject',
          message: 'Unable to identify organization for this call'
        },
        { status: 403 }
      )
    }
    
    // Check organization access
    const { data: org } = await supabase
      .from('organizations')
      .select('plan, trial_ends_at, admin_granted_plan, admin_granted_plan_expires_at, admin_privileges, id, name, billing_customer_id')
      .eq('id', organizationId)
      .maybeSingle()
    
    if (!org) {
      console.error('[Pre-Call Check] ❌ Organization not found in database')
      return NextResponse.json(
        { 
          error: 'Organization not found',
          action: 'reject',
          message: 'Organization does not exist'
        },
        { status: 403 }
      )
    }
    
    console.log(`[Pre-Call Check] Checking access for org: ${org.name} (${org.id})`)
    
    // Check for admin-granted privileges
    const privileges = org.admin_privileges || {}
    if (privileges.bypass_limits === true) {
      console.log('[Pre-Call Check] ✅ Access granted: admin privilege bypass')
      return NextResponse.json({ allowed: true, reason: 'admin_privilege_bypass' })
    }
    
    // Check admin-granted plan
    if (org.admin_granted_plan) {
      const expiresAt = org.admin_granted_plan_expires_at
        ? new Date(org.admin_granted_plan_expires_at)
        : null
      if (!expiresAt || expiresAt > new Date()) {
        console.log('[Pre-Call Check] ✅ Access granted: admin-granted plan')
        return NextResponse.json({ allowed: true, reason: `admin_granted_plan_${org.admin_granted_plan}` })
      }
    }
    
    // Check paid plan - MUST verify Stripe subscription is actually active
    if (org.plan) {
      // Check if starter plan is blocked
      if (org.plan === 'starter' && isStarterPlanBlocked(org)) {
        console.log('[Pre-Call Check] ❌ Access denied: starter plan blocked')
        return NextResponse.json(
          { 
            error: 'Starter plan access blocked',
            action: 'reject',
            message: 'Starter plan access has been restricted for this organization.'
          },
          { status: 403 }
        )
      }

      // If we have a billing customer ID, verify the subscription is actually active
      if (org.billing_customer_id && stripe) {
        try {
          console.log(`[Pre-Call Check] Checking Stripe subscription for customer: ${org.billing_customer_id}`)
          const subscriptions = await stripe.subscriptions.list({
            customer: org.billing_customer_id,
            status: 'active',
            limit: 1,
          })

          console.log(`[Pre-Call Check] Stripe subscriptions found: ${subscriptions.data.length}`)

          // If no active subscription found, deny access
          if (subscriptions.data.length === 0) {
            console.warn(`[Pre-Call Check] ❌ BLOCKED - Org ${organizationId} has plan ${org.plan} but no active Stripe subscription. Blocking call.`)
            return NextResponse.json(
              { 
                error: 'Subscription ended',
                action: 'reject',
                message: 'Your subscription has ended. Please renew to continue using FusionCaller.'
              },
              { status: 403 }
            )
          }

          // Subscription is active, allow access
          console.log(`[Pre-Call Check] ✅ ALLOWED - Active subscription found: ${subscriptions.data[0].id}`)
          return NextResponse.json({ allowed: true, reason: 'active_plan' })
        } catch (error: any) {
          console.error(`[Pre-Call Check] Error checking Stripe subscription for org ${organizationId}:`, error)
          // If Stripe check fails, deny access (fail closed) for security
          return NextResponse.json(
            { 
              error: 'Unable to verify subscription',
              action: 'reject',
              message: 'Unable to verify subscription status. Please contact support.'
            },
            { status: 403 }
          )
        }
      }

      // No billing customer ID, but plan exists
      // Check if there's an admin-granted plan that might be active
      // Otherwise, deny access if we can't verify subscription
      if (!org.admin_granted_plan) {
        console.warn(`[Pre-Call Check] ❌ BLOCKED - Org ${organizationId} has plan ${org.plan} but no billing_customer_id. Cannot verify subscription.`)
        return NextResponse.json(
          { 
            error: 'Cannot verify subscription',
            action: 'reject',
            message: 'Cannot verify subscription - no billing customer ID.'
          },
          { status: 403 }
        )
      }

      // If admin-granted plan exists and is active, allow access
      // Otherwise deny
      console.warn(`[Pre-Call Check] ❌ BLOCKED - No active subscription`)
      return NextResponse.json(
        { 
          error: 'No active subscription',
          action: 'reject',
          message: 'No active subscription found.'
        },
        { status: 403 }
      )
    }
    
    // Check trial
    if (org.trial_ends_at) {
      const trialEndsAt = new Date(org.trial_ends_at)
      if (new Date() < trialEndsAt) {
        console.log('[Pre-Call Check] ✅ Access granted: active trial')
        return NextResponse.json({ allowed: true, reason: 'active_trial' })
      } else {
        console.log('[Pre-Call Check] ❌ Access denied: trial expired')
        return NextResponse.json(
          { 
            error: 'Trial expired',
            action: 'reject',
            message: 'Your trial has expired. Please subscribe to continue using FusionCaller.'
          },
          { status: 403 }
        )
      }
    }
    
    // No access
    console.log('[Pre-Call Check] ❌ Access denied: no subscription or trial')
    return NextResponse.json(
      { 
        error: 'No active subscription or trial',
        action: 'reject',
        message: 'Please subscribe to continue using FusionCaller.'
      },
      { status: 403 }
    )
    
  } catch (error) {
    console.error('[Pre-Call Check] Error:', error)
    // On error, allow the call through (fail open) to avoid blocking legitimate calls
    // You can change this to fail closed if preferred
    console.log('[Pre-Call Check] ⚠️ Error checking access, allowing call through (fail open)')
    return NextResponse.json({ allowed: true, reason: 'error_checking_access' })
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Pre-call check endpoint is active',
    timestamp: new Date().toISOString(),
    endpoint: '/api/vapi/pre-call-check'
  })
}

