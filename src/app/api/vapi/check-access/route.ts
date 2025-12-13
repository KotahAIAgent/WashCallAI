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
    let agentConfig: { organization_id: string; inbound_enabled: boolean; outbound_enabled: boolean; inbound_agent_id: string | null; outbound_agent_id: string | null } | null = null
    if (assistantId) {
      const { data: config } = await supabase
        .from('agent_configs')
        .select('organization_id, inbound_enabled, outbound_enabled, inbound_agent_id, outbound_agent_id')
        .or(`inbound_agent_id.eq.${assistantId},outbound_agent_id.eq.${assistantId}`)
        .maybeSingle()
      
      if (config) {
        agentConfig = config
        organizationId = config.organization_id
        console.log('[Vapi Check Access] Found org by assistant ID:', organizationId)
        
        // Check if this is an inbound call and if inbound is disabled
        const isInboundCall = config.inbound_agent_id === assistantId
        if (isInboundCall && !config.inbound_enabled) {
          console.log('[Vapi Check Access] ❌ Access denied: Inbound agent is disabled')
          return NextResponse.json({
            allowed: false,
            action: 'hangup',
            message: 'The inbound agent is currently disabled. Calls will not be answered.',
            instruction: 'Hang up the call immediately. Do not answer or speak to the caller.',
          }, { status: 403 })
        }
        
        // Check if this is an outbound call and if outbound is disabled
        const isOutboundCall = config.outbound_agent_id === assistantId
        if (isOutboundCall && !config.outbound_enabled) {
          console.log('[Vapi Check Access] ❌ Access denied: Outbound agent is disabled')
          return NextResponse.json({
            allowed: false,
            action: 'hangup',
            message: 'The outbound agent is currently disabled.',
            instruction: 'Do not proceed with this call.',
          }, { status: 403 })
        }
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
    
    // If still not found, try by actual phone number (multiple formats)
    if (!organizationId && toNumber) {
      const normalized = normalizePhoneNumber(toNumber)
      
      // Try phone_numbers table first
      if (normalized) {
        const { data: phoneNumber } = await supabase
          .from('phone_numbers')
          .select('organization_id')
          .eq('phone_number', normalized)
          .maybeSingle()
        
        if (phoneNumber) {
          organizationId = phoneNumber.organization_id
          console.log('[Vapi Check Access] ✅ Found org by phone number in phone_numbers table:', organizationId)
          
          // Check if inbound agent is enabled (this is likely an inbound call)
          if (!agentConfig) {
            const { data: config } = await supabase
              .from('agent_configs')
              .select('inbound_enabled')
              .eq('organization_id', organizationId)
              .maybeSingle()
            
            if (config && !config.inbound_enabled) {
              console.log('[Vapi Check Access] ❌ Access denied: Inbound agent is disabled')
              return NextResponse.json({
                allowed: false,
                action: 'hangup',
                message: 'The inbound agent is currently disabled. Calls will not be answered.',
                instruction: 'Hang up the call immediately. Do not answer or speak to the caller.',
              }, { status: 403 })
            }
          }
        }
      }
      
      // Also try exact match (without normalization)
      if (!organizationId) {
        const { data: phoneNumberExact } = await supabase
          .from('phone_numbers')
          .select('organization_id')
          .eq('phone_number', toNumber)
          .maybeSingle()
        
        if (phoneNumberExact) {
          organizationId = phoneNumberExact.organization_id
          console.log('[Vapi Check Access] ✅ Found org by exact phone number:', organizationId)
        }
      }
      
      // Also try agent_configs table (for legacy phone numbers)
      if (!organizationId) {
        const { data: agentConfig } = await supabase
          .from('agent_configs')
          .select('organization_id')
          .or(`inbound_phone_number.eq.${toNumber},inbound_phone_number.eq.${normalized || ''}`)
          .maybeSingle()
        
        if (agentConfig) {
          organizationId = agentConfig.organization_id
          console.log('[Vapi Check Access] ✅ Found org by phone number in agent_configs:', organizationId)
        }
      }
    }
    
    // If we still can't identify, FAIL OPEN (allow the call) to avoid blocking legitimate calls
    // Only deny access if we're CERTAIN the organization doesn't have access
    if (!organizationId) {
      console.warn('[Vapi Check Access] ⚠️ Could not identify organization - ALLOWING call through (fail open)')
      console.warn('[Vapi Check Access] Payload received:', JSON.stringify(payload, null, 2))
      return NextResponse.json({
        allowed: true,
        message: 'Organization could not be identified, allowing call through.',
        reason: 'unidentified_org_fail_open',
      })
    }
    
    // Check organization access
    const { data: org } = await supabase
      .from('organizations')
      .select('plan, trial_ends_at, admin_granted_plan, admin_granted_plan_expires_at, admin_privileges, id, name')
      .eq('id', organizationId)
      .maybeSingle()
    
    if (!org) {
      console.warn('[Vapi Check Access] ⚠️ Organization not found in database - ALLOWING call through (fail open)')
      return NextResponse.json({
        allowed: true,
        message: 'Organization not found in database, allowing call through.',
        reason: 'org_not_found_fail_open',
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
          action: 'hangup',
          message: 'Your trial has expired. Please subscribe to continue using FusionCaller.',
          instruction: 'Hang up the call immediately. Do not answer or speak to the caller.',
        }, { status: 403 })
      }
    }
    
    // No access
    console.log('[Vapi Check Access] ❌ Access denied: no subscription or trial')
    return NextResponse.json({
      allowed: false,
      action: 'hangup',
      message: 'Your subscription has ended. Please renew to continue using FusionCaller.',
      instruction: 'Hang up the call immediately. Do not answer or speak to the caller.',
    }, { status: 403 })
    
  } catch (error: any) {
    console.error('[Vapi Check Access] ❌ Error checking access:', error)
    // FAIL OPEN - allow call through on error to avoid blocking legitimate calls
    // Only deny if we're CERTAIN the organization doesn't have access
    console.warn('[Vapi Check Access] ⚠️ Error occurred - ALLOWING call through (fail open)')
    return NextResponse.json({
      allowed: true,
      message: 'Error verifying access, allowing call through.',
      reason: 'error_fail_open',
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

