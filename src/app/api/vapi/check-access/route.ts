import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Vapi Function/Server URL endpoint to check access at the START of a call
 * This is called by Vapi as a function call or server URL BEFORE the call connects
 * 
 * Vapi will call this with call metadata including:
 * - assistantId or assistant_id
 * - phoneNumberId or phoneNumber_id
 * - from, to (phone numbers)
 * 
 * Returns:
 * - { allowed: true } if access granted
 * - { allowed: false, message: "..." } if access denied
 */
export const dynamic = 'force-dynamic'

// Normalize phone number to E.164 format
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
    console.log('[Vapi Check Access] Received request:', JSON.stringify(payload, null, 2))
    console.log('[Vapi Check Access] All payload keys:', Object.keys(payload))
    
    const supabase = createServiceRoleClient()
    
    // Extract identifiers from payload - try all possible formats
    const assistantId = payload.assistantId || 
                       payload.assistant_id || 
                       payload.assistant?.id ||
                       payload.assistantId ||
                       payload.assistant?.assistantId
    const phoneNumberId = payload.phoneNumberId || 
                         payload.phoneNumber_id || 
                         payload.phoneNumber?.id ||
                         payload.phone?.id ||
                         payload.phoneNumberId
    const toNumber = payload.to || 
                    payload.callee?.number || 
                    payload.phoneNumber?.number ||
                    payload.phone?.number ||
                    payload.customer?.number
    
    console.log('[Vapi Check Access] Extracted identifiers:', {
      assistantId,
      phoneNumberId,
      toNumber,
      fullPayload: payload,
    })
    
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
        console.log('[Vapi Check Access] Found org by assistant ID:', organizationId)
      }
    }
    
    // If not found, try by phone number ID
    if (!organizationId && phoneNumberId) {
      const { data: phoneNumber } = await supabase
        .from('phone_numbers')
        .select('organization_id')
        .eq('provider_phone_id', phoneNumberId)
        .maybeSingle()
      
      if (phoneNumber) {
        organizationId = phoneNumber.organization_id
        console.log('[Vapi Check Access] Found org by phone number ID:', organizationId)
      }
    }
    
    // If still not found, try by actual phone number
    if (!organizationId && toNumber) {
      const normalized = normalizePhoneNumber(toNumber)
      if (normalized) {
        const { data: phoneNumber } = await supabase
          .from('phone_numbers')
          .select('organization_id')
          .eq('phone_number', normalized)
          .maybeSingle()
        
        if (phoneNumber) {
          organizationId = phoneNumber.organization_id
          console.log('[Vapi Check Access] Found org by phone number:', organizationId)
        }
      }
    }
    
    if (!organizationId) {
      console.error('[Vapi Check Access] ❌ Could not identify organization')
      return NextResponse.json({
        allowed: false,
        message: 'Unable to identify organization. Access denied.',
      })
    }
    
    // Check organization access
    const { data: org } = await supabase
      .from('organizations')
      .select('plan, trial_ends_at, admin_granted_plan, admin_granted_plan_expires_at, admin_privileges, id, name')
      .eq('id', organizationId)
      .maybeSingle()
    
    if (!org) {
      console.error('[Vapi Check Access] ❌ Organization not found')
      return NextResponse.json({
        allowed: false,
        message: 'Organization not found. Access denied.',
      })
    }
    
    console.log(`[Vapi Check Access] Checking access for org: ${org.name} (${org.id})`)
    console.log(`[Vapi Check Access] Org data:`, {
      plan: org.plan || 'null',
      trial_ends_at: org.trial_ends_at || 'null',
      admin_granted_plan: org.admin_granted_plan || 'null',
    })
    
    // Check for admin-granted privileges
    const privileges = org.admin_privileges || {}
    if (privileges.bypass_limits === true) {
      console.log('[Vapi Check Access] ✅ Access granted: admin privilege bypass')
      return NextResponse.json({ allowed: true })
    }
    
    // Check admin-granted plan
    if (org.admin_granted_plan) {
      const expiresAt = org.admin_granted_plan_expires_at
        ? new Date(org.admin_granted_plan_expires_at)
        : null
      if (!expiresAt || expiresAt > new Date()) {
        console.log('[Vapi Check Access] ✅ Access granted: admin-granted plan')
        return NextResponse.json({ allowed: true })
      }
    }
    
    // Check paid plan
    if (org.plan) {
      console.log('[Vapi Check Access] ✅ Access granted: active plan')
      return NextResponse.json({ allowed: true })
    }
    
    // Check trial
    if (org.trial_ends_at) {
      const trialEndsAt = new Date(org.trial_ends_at)
      if (new Date() < trialEndsAt) {
        console.log('[Vapi Check Access] ✅ Access granted: active trial')
        return NextResponse.json({ allowed: true })
      } else {
        console.log('[Vapi Check Access] ❌ Access denied: trial expired')
        return NextResponse.json({
          allowed: false,
          message: 'Your trial has expired. Please subscribe to continue using FusionCaller.',
        })
      }
    }
    
    // No access
    console.log('[Vapi Check Access] ❌ Access denied: no subscription or trial')
    return NextResponse.json({
      allowed: false,
      message: 'Your subscription has ended. Please renew to continue using FusionCaller.',
    })
    
  } catch (error: any) {
    console.error('[Vapi Check Access] Error:', error)
    // Fail closed - deny access on error
    return NextResponse.json({
      allowed: false,
      message: 'Unable to verify access. Please contact support.',
    })
  }
}

// Also support GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Vapi access check endpoint is active',
    timestamp: new Date().toISOString(),
    endpoint: '/api/vapi/check-access',
  })
}

