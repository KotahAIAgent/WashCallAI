import { stripe } from '@/lib/stripe/server'
import { STRIPE_PLANS, getIndustryPricing } from '@/lib/stripe/server'
import { createActionClient } from '@/lib/supabase/server'
import type { IndustrySlug } from '@/lib/industries/config'

/**
 * Simple Vapi to Stripe billing integration
 * Charges customers for overage calls when they exceed their plan limits
 */

interface ChargeCallOptions {
  organizationId: string
  callId: string
  callDuration: number // in seconds
  callDirection: 'inbound' | 'outbound'
  isOverage: boolean // true if this call exceeds plan limits
  industrySlug?: IndustrySlug | null // Industry for pricing
}

/**
 * Charge for a Vapi call via Stripe
 * Creates an invoice item that will be included in the next invoice
 */
export async function chargeVapiCall({
  organizationId,
  callId,
  callDuration,
  callDirection,
  isOverage,
  industrySlug: providedIndustrySlug,
}: ChargeCallOptions) {
  try {
    const supabase = createActionClient()

    // Get organization billing info
    const { data: org } = await supabase
      .from('organizations')
      .select('billing_customer_id, plan, industry')
      .eq('id', organizationId)
      .single()

    if (!org?.billing_customer_id) {
      console.log(`No Stripe customer found for org ${organizationId}`)
      return { success: false, error: 'No billing customer' }
    }

    if (!stripe) {
      console.log('Stripe not configured')
      return { success: false, error: 'Stripe not configured' }
    }

    // Get industry-specific overage rate
    const industrySlug = (org?.industry as IndustrySlug) || providedIndustrySlug || null
    const industryPricing = industrySlug ? getIndustryPricing(org?.plan as any, industrySlug) : null
    const overageRate = industryPricing?.overageRate || 0.20

    // Calculate how many minutes of this call are overage
    // Get current usage to determine overage minutes
    const chargeCheck = await shouldChargeCall(organizationId, callDuration)
    const overageMinutes = chargeCheck.overageMinutes || 0

    // Only charge for the overage portion of the call
    if (overageMinutes <= 0 || !isOverage) {
      return { success: true, message: 'Call within plan limits, no charge' }
    }

    // Charge only for the overage minutes (not the entire call)
    const callCostCents = Math.round(overageMinutes * overageRate * 100)
    const totalCallMinutes = Math.ceil(callDuration / 60)

    // Create invoice item for this call (only for overage minutes)
    const invoiceItem = await stripe.invoiceItems.create({
      customer: org.billing_customer_id,
      amount: callCostCents,
      currency: 'usd',
      description: `Vapi ${callDirection} call - ${overageMinutes} overage min @ $${overageRate}/min (${totalCallMinutes} min total)`,
      metadata: {
        organization_id: organizationId,
        call_id: callId,
        call_direction: callDirection,
        call_duration_seconds: callDuration.toString(),
        total_call_minutes: totalCallMinutes.toString(),
        overage_minutes: overageMinutes.toString(),
        overage_rate: overageRate.toString(),
        is_overage: 'true',
      },
    })

    console.log(`✅ Charged $${(callCostCents / 100).toFixed(2)} for ${overageMinutes} overage minutes (${totalCallMinutes} min total) on call ${callId}`)

    return {
      success: true,
      invoiceItemId: invoiceItem.id,
      amount: callCostCents,
      message: `Charged $${(callCostCents / 100).toFixed(2)} for overage call`,
    }
  } catch (error) {
    console.error('Error charging Vapi call:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if a call should be charged (exceeds plan limits)
 * Uses actual minutes tracked in billable_minutes_this_month
 */
export async function shouldChargeCall(organizationId: string, callDurationSeconds: number = 0): Promise<{
  shouldCharge: boolean
  reason: string
  currentUsage: number // in minutes
  planLimit: number // in minutes
  callMinutes: number
  overageMinutes: number // minutes that exceed the limit
  minutesFromMonthly?: number // minutes used from monthly plan
  minutesFromCredits?: number // minutes used from purchased credits
  remainingCredits?: number // remaining credits after this call
}> {
  const supabase = createActionClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('plan, billable_minutes_this_month, billing_period_month, billing_period_year, industry, purchased_credits_minutes')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return {
      shouldCharge: false,
      reason: 'Organization not found',
      currentUsage: 0,
      planLimit: 0,
      callMinutes: 0,
      overageMinutes: 0,
      minutesFromMonthly: 0,
      minutesFromCredits: 0,
      remainingCredits: 0,
    }
  }

  const plan = org.plan as 'starter' | 'growth' | 'pro' | null
  if (!plan) {
    const callMinutes = Math.ceil(callDurationSeconds / 60)
    return {
      shouldCharge: false,
      reason: 'No plan',
      currentUsage: 0,
      planLimit: 0,
      callMinutes,
      overageMinutes: 0,
      minutesFromMonthly: 0,
      minutesFromCredits: 0,
      remainingCredits: 0,
    }
  }

  // Get industry-specific pricing
  const industrySlug = (org.industry as IndustrySlug) || null
  const industryPricing = getIndustryPricing(plan, industrySlug)
  const planLimit = industryPricing.minutes

  // Unlimited plans don't charge (-1 means unlimited)
  if (planLimit === -1 || planLimit < 0) {
    const callMinutes = Math.ceil(callDurationSeconds / 60)
    return {
      shouldCharge: false,
      reason: 'Unlimited plan',
      currentUsage: 0,
      planLimit: -1,
      callMinutes,
      overageMinutes: 0,
      minutesFromMonthly: callMinutes,
      minutesFromCredits: 0,
      remainingCredits: org.purchased_credits_minutes || 0,
    }
  }

  // Use actual minutes tracked in database
  const currentUsageMinutes = org.billable_minutes_this_month || 0
  const callMinutes = Math.ceil(callDurationSeconds / 60)
  const purchasedCredits = org.purchased_credits_minutes || 0
  
  // Calculate usage: monthly minutes first, then credits
  // If monthly minutes are exhausted, use credits
  const remainingMonthlyMinutes = Math.max(0, planLimit - currentUsageMinutes)
  const minutesFromCredits = Math.max(0, callMinutes - remainingMonthlyMinutes)
  const minutesFromMonthly = Math.min(callMinutes, remainingMonthlyMinutes)
  
  // Calculate how many minutes exceed both monthly limit AND credits
  const totalAvailable = planLimit + purchasedCredits
  const projectedUsage = currentUsageMinutes + callMinutes
  const overageMinutes = Math.max(0, projectedUsage - totalAvailable)
  const isOverage = overageMinutes > 0

  return {
    shouldCharge: isOverage,
    reason: isOverage ? 'Exceeds plan minutes and credits' : minutesFromCredits > 0 ? 'Using purchased credits' : 'Within plan limits',
    currentUsage: currentUsageMinutes,
    planLimit,
    callMinutes,
    overageMinutes,
    minutesFromMonthly,
    minutesFromCredits,
    remainingCredits: purchasedCredits - minutesFromCredits,
  }
}

/**
 * Batch charge multiple calls at once (for efficiency)
 */
export async function chargeVapiCallsBatch(calls: ChargeCallOptions[]) {
  const results = await Promise.allSettled(
    calls.map(call => chargeVapiCall(call))
  )

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length

  return {
    total: calls.length,
    successful,
    failed,
    results: results.map((r, i) => ({
      callId: calls[i].callId,
      result: r.status === 'fulfilled' ? r.value : { error: 'Failed' },
    })),
  }
}

