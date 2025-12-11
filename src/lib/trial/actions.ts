'use server'

import { createActionClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { revalidatePath } from 'next/cache'
import { isStarterPlanBlocked } from '@/lib/admin/utils'

const TRIAL_DURATION_DAYS = 7

export interface TrialStatus {
  isOnTrial: boolean
  trialStartedAt: Date | null
  trialEndsAt: Date | null
  daysRemaining: number
  isExpired: boolean
  hasUsedTrial: boolean
  canStartTrial: boolean
}

export async function getTrialStatus(organizationId: string): Promise<TrialStatus> {
  const supabase = createActionClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('trial_started_at, trial_ends_at, trial_used, plan, trial_plan')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    return {
      isOnTrial: false,
      trialStartedAt: null,
      trialEndsAt: null,
      daysRemaining: 0,
      isExpired: false,
      hasUsedTrial: false,
      canStartTrial: true,
    }
  }

  const now = new Date()
  const trialEndsAt = org.trial_ends_at ? new Date(org.trial_ends_at) : null
  const trialStartedAt = org.trial_started_at ? new Date(org.trial_started_at) : null
  
  // Calculate if trial is active
  const isOnTrial = trialEndsAt ? now < trialEndsAt : false
  const isExpired = trialEndsAt ? now >= trialEndsAt : false
  
  // Calculate days remaining
  let daysRemaining = 0
  if (trialEndsAt && now < trialEndsAt) {
    daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Can start trial if never used and no active plan
  const canStartTrial = !org.trial_used && !org.plan

  return {
    isOnTrial,
    trialStartedAt,
    trialEndsAt,
    daysRemaining,
    isExpired,
    hasUsedTrial: org.trial_used || false,
    canStartTrial,
  }
}

export async function startFreeTrial(organizationId: string, trialPlan?: 'starter' | 'growth' | 'pro') {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Check if user can start trial
  const { data: org } = await supabase
    .from('organizations')
    .select('trial_used, plan, admin_privileges')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return { error: 'Organization not found' }
  }

  if (org.trial_used) {
    return { error: 'You have already used your free trial' }
  }

  if (org.plan) {
    return { error: 'You already have an active subscription' }
  }

  // Only allow Starter plan for free trials
  // Growth and Pro require payment to access outbound features
  if (trialPlan && trialPlan !== 'starter') {
    return { error: 'Free trials are only available for Starter plan. Growth and Pro plans require payment to access outbound features.' }
  }
  
  // Default to starter if no plan specified
  const finalTrialPlan = trialPlan || 'starter'

  // Check if starter plan is blocked
  if (finalTrialPlan === 'starter' && isStarterPlanBlocked(org)) {
    return { error: 'Starter plan access has been restricted for this organization. Please contact support or choose a different plan.' }
  }

  // Start the trial
  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)

  const updateData: any = {
    trial_started_at: now.toISOString(),
    trial_ends_at: trialEndsAt.toISOString(),
    trial_used: true,
    // Set setup status to active during trial
    setup_status: 'active',
  }

  // Store trial plan (always starter for free trials)
  updateData.trial_plan = finalTrialPlan

  const { error } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', organizationId)

  if (error) {
    console.error('Error starting trial:', error)
    return { error: error.message }
  }

  revalidatePath('/app')
  return { 
    success: true, 
    trialEndsAt: trialEndsAt.toISOString(),
    daysRemaining: TRIAL_DURATION_DAYS,
    trialPlan: finalTrialPlan,
  }
}

export async function extendTrial(organizationId: string, additionalDays: number) {
  const supabase = createActionClient()

  // Admin only - extend trial for special cases
  const { data: org } = await supabase
    .from('organizations')
    .select('trial_ends_at')
    .eq('id', organizationId)
    .single()

  if (!org || !org.trial_ends_at) {
    return { error: 'No active trial to extend' }
  }

  const currentEndDate = new Date(org.trial_ends_at)
  const newEndDate = new Date(currentEndDate.getTime() + additionalDays * 24 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('organizations')
    .update({
      trial_ends_at: newEndDate.toISOString(),
    })
    .eq('id', organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { success: true, newEndDate: newEndDate.toISOString() }
}

// Helper function to refund setup fee
async function refundSetupFee(organizationId: string, customerId: string): Promise<boolean> {
  try {
    // Get all invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    })

    // Find the setup fee charge
    let setupFeePaymentIntentId: string | null = null

    for (const invoice of invoices.data) {
      if (invoice.lines.data) {
        for (const line of invoice.lines.data) {
          if (line.metadata?.setup_fee === 'true') {
            if (invoice.payment_intent && typeof invoice.payment_intent === 'string') {
              setupFeePaymentIntentId = invoice.payment_intent
              break
            } else if (typeof invoice.payment_intent === 'object' && invoice.payment_intent?.id) {
              setupFeePaymentIntentId = invoice.payment_intent.id
              break
            }
          }
        }
      }
    }

    // If not found in invoices, check payment intents directly
    if (!setupFeePaymentIntentId) {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 100,
      })

      for (const pi of paymentIntents.data) {
        if (pi.metadata?.setup_fee === 'true') {
          setupFeePaymentIntentId = pi.id
          break
        }
      }
    }

    if (!setupFeePaymentIntentId) {
      console.log('Setup fee payment not found for customer:', customerId)
      return false
    }

    // Process the refund (Stripe will handle if already refunded)
    await stripe.refunds.create({
      payment_intent: setupFeePaymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        organization_id: organizationId,
        reason: 'trial_cancellation',
      },
    })

    return true
  } catch (error) {
    console.error('Error refunding setup fee:', error)
    return false
  }
}

export async function cancelTrial(organizationId: string) {
  const supabase = createActionClient()

  // Check if user is still within trial period (for setup fee refund)
  const { data: org } = await supabase
    .from('organizations')
    .select('trial_ends_at, billing_customer_id, setup_fee_refunded')
    .eq('id', organizationId)
    .single()

  const now = new Date()
  const trialEndsAt = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
  const isOnTrial = trialEndsAt && now < trialEndsAt

  let setupFeeRefunded = false

  // If still on trial, automatically refund setup fee
  if (isOnTrial && org?.billing_customer_id && !org?.setup_fee_refunded) {
    setupFeeRefunded = await refundSetupFee(organizationId, org.billing_customer_id)
    
    if (setupFeeRefunded) {
      // Update organization to track refund
      await supabase
        .from('organizations')
        .update({
          setup_fee_refunded: true,
          setup_fee_refunded_at: new Date().toISOString(),
        })
        .eq('id', organizationId)
    }
  }

  // End the trial
  const { error } = await supabase
    .from('organizations')
    .update({
      trial_ends_at: new Date().toISOString(), // End immediately
    })
    .eq('id', organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { 
    success: true,
    setupFeeRefunded,
  }
}

// Check if organization has active access (trial or paid)
export async function hasActiveAccess(organizationId: string): Promise<boolean> {
  const supabase = createActionClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('plan, trial_ends_at')
    .eq('id', organizationId)
    .single()

  if (!org) return false

  // Has paid plan
  if (org.plan) return true

  // Has active trial
  if (org.trial_ends_at) {
    const trialEndsAt = new Date(org.trial_ends_at)
    if (new Date() < trialEndsAt) return true
  }

  return false
}

// Check and enforce access - returns detailed status
export interface AccessStatus {
  hasAccess: boolean
  reason: 'active_plan' | 'active_trial' | 'trial_expired' | 'no_subscription' | 'not_found'
  daysUntilExpiry?: number
  plan?: string | null
}

export async function checkAccessStatus(organizationId: string): Promise<AccessStatus> {
  const supabase = createActionClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('plan, trial_ends_at, trial_used')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return { hasAccess: false, reason: 'not_found' }
  }

  // Has paid plan - full access
  if (org.plan) {
    return { hasAccess: true, reason: 'active_plan', plan: org.plan }
  }

  // Check trial status
  if (org.trial_ends_at) {
    const trialEndsAt = new Date(org.trial_ends_at)
    const now = new Date()
    
    if (now < trialEndsAt) {
      const daysUntilExpiry = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { hasAccess: true, reason: 'active_trial', daysUntilExpiry }
    } else {
      return { hasAccess: false, reason: 'trial_expired' }
    }
  }

  return { hasAccess: false, reason: 'no_subscription' }
}

// Disable all AI services for an organization (called when trial/subscription ends)
export async function disableOrganizationServices(organizationId: string) {
  const supabase = createActionClient()

  // Disable agent configs
  const { error: agentError } = await supabase
    .from('agent_configs')
    .update({
      inbound_enabled: false,
      outbound_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)

  if (agentError) {
    console.error('Error disabling agent configs:', agentError)
  }

  // Pause all active campaigns
  const { error: campaignError } = await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (campaignError) {
    console.error('Error pausing campaigns:', campaignError)
  }

  // Update organization setup status
  await supabase
    .from('organizations')
    .update({ setup_status: 'ready' }) // Ready but not active
    .eq('id', organizationId)

  return { success: true }
}

// Re-enable services when subscription/trial starts
export async function enableOrganizationServices(organizationId: string) {
  const supabase = createActionClient()

  // Re-enable agent configs (but don't auto-enable features - user should choose)
  const { error: agentError } = await supabase
    .from('agent_configs')
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)

  if (agentError) {
    console.error('Error updating agent configs:', agentError)
  }

  // Update organization setup status to active
  await supabase
    .from('organizations')
    .update({ setup_status: 'active' })
    .eq('id', organizationId)

  return { success: true }
}

// API endpoint helper to quickly check access (for webhooks)
export async function quickAccessCheck(organizationId: string): Promise<{
  allowed: boolean
  message?: string
}> {
  const status = await checkAccessStatus(organizationId)
  
  if (status.hasAccess) {
    return { allowed: true }
  }

  switch (status.reason) {
    case 'trial_expired':
      return { allowed: false, message: 'Trial has expired. Please subscribe to continue.' }
    case 'no_subscription':
      return { allowed: false, message: 'No active subscription. Please subscribe or start a trial.' }
    case 'not_found':
      return { allowed: false, message: 'Organization not found.' }
    default:
      return { allowed: false, message: 'Access denied.' }
  }
}

