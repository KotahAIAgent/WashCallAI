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

    const callMinutes = Math.ceil(callDuration / 60) // Round up to nearest minute
    const callCostCents = Math.round(callMinutes * overageRate * 100)

    // Only charge for overage calls (or customize this logic)
    if (!isOverage) {
      return { success: true, message: 'Call within plan limits, no charge' }
    }

    // Create invoice item for this call
    const invoiceItem = await stripe.invoiceItems.create({
      customer: org.billing_customer_id,
      amount: callCostCents,
      currency: 'usd',
      description: `Vapi ${callDirection} call (${callMinutes} min) - Overage @ $${overageRate}/min`,
      metadata: {
        organization_id: organizationId,
        call_id: callId,
        call_direction: callDirection,
        call_duration_seconds: callDuration.toString(),
        call_minutes: callMinutes.toString(),
        is_overage: 'true',
      },
    })

    console.log(`✅ Charged $${(callCostCents / 100).toFixed(2)} for overage call ${callId}`)

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
 * Now tracks minutes instead of calls
 */
export async function shouldChargeCall(organizationId: string, callDurationSeconds: number = 0): Promise<{
  shouldCharge: boolean
  reason: string
  currentUsage: number // in minutes
  planLimit: number // in minutes
  callMinutes: number
}> {
  const supabase = createActionClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('plan, billable_calls_this_month, billing_period_month, billing_period_year, industry')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return {
      shouldCharge: false,
      reason: 'Organization not found',
      currentUsage: 0,
      planLimit: 0,
      callMinutes: 0,
    }
  }

  const plan = org.plan as 'starter' | 'growth' | 'pro' | null
  if (!plan) {
    return {
      shouldCharge: false,
      reason: 'No plan',
      currentUsage: 0,
      planLimit: 0,
      callMinutes: Math.ceil(callDurationSeconds / 60),
    }
  }

  // Get industry-specific pricing
  const industrySlug = (org.industry as IndustrySlug) || null
  const industryPricing = getIndustryPricing(plan, industrySlug)
  const planLimit = industryPricing.minutes

  // Unlimited plans don't charge (-1 means unlimited)
  if (planLimit === -1 || planLimit < 0) {
    return {
      shouldCharge: false,
      reason: 'Unlimited plan',
      currentUsage: 0,
      planLimit: -1,
      callMinutes: Math.ceil(callDurationSeconds / 60),
    }
  }

  // TODO: Update database schema to track billable_minutes_this_month instead of billable_calls_this_month
  // For now, we'll use a conversion estimate (assuming average call duration)
  const avgCallDuration = industryPricing.avgCallDuration || 5
  const currentUsageMinutes = (org.billable_calls_this_month || 0) * avgCallDuration
  const callMinutes = Math.ceil(callDurationSeconds / 60)
  const projectedUsage = currentUsageMinutes + callMinutes
  const isOverage = projectedUsage > planLimit

  return {
    shouldCharge: isOverage,
    reason: isOverage ? 'Exceeds plan minutes limit' : 'Within plan limits',
    currentUsage: currentUsageMinutes,
    planLimit,
    callMinutes,
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

