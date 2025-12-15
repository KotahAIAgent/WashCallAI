'use server'

import { createActionClient } from '@/lib/supabase/server'
import { calculateAssistantCost, BASE_COST_PER_MINUTE } from '@/lib/assistants/recommended-settings'
import { getIndustryPricing } from '@/lib/stripe/server'
import type { IndustrySlug } from '@/lib/industries/config'

/**
 * Adjust organization's effective minutes based on assistant cost
 * When an assistant costs more than base, reduce their effective minutes
 */
export async function adjustMinutesForAssistant(
  organizationId: string,
  model: string,
  voiceId?: string
): Promise<{ success: boolean; adjustedMinutes?: number; error?: string }> {
  const supabase = createActionClient()

  // Get organization details
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('plan, industry')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    return { success: false, error: 'Organization not found' }
  }

  // Get base minutes from plan pricing
  const industryPricing = getIndustryPricing(
    org.plan as 'starter' | 'growth' | 'pro' | null,
    org.industry as IndustrySlug | null
  )
  
  const baseMinutes = industryPricing?.minutes || 0
  
  // Skip adjustment for unlimited plans or no plan
  if (baseMinutes <= 0) {
    return { success: true, adjustedMinutes: baseMinutes }
  }

  // Calculate actual cost
  const actualCost = calculateAssistantCost(model, voiceId)
  
  // If cost is same or less than base, no adjustment needed
  if (actualCost <= BASE_COST_PER_MINUTE) {
    return { success: true, adjustedMinutes: baseMinutes }
  }

  // Calculate adjusted minutes
  const budget = baseMinutes * BASE_COST_PER_MINUTE
  const adjustedMinutes = Math.floor(budget / actualCost)

  // Store adjusted minutes in organization metadata
  // We'll use the onboarding_data JSONB field or create a new field
  // For now, let's use a metadata field approach
  const { data: currentOrg } = await supabase
    .from('organizations')
    .select('onboarding_data')
    .eq('id', organizationId)
    .single()

  const metadata = (currentOrg?.onboarding_data as any) || {}
  metadata.assistantCostAdjustment = {
    model,
    actualCost,
    baseCost: BASE_COST_PER_MINUTE,
    baseMinutes,
    adjustedMinutes,
    adjustedAt: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      onboarding_data: metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, adjustedMinutes }
}

/**
 * Get effective minutes for an organization (considering cost adjustments)
 */
export async function getEffectiveMinutes(organizationId: string): Promise<{
  baseMinutes: number
  effectiveMinutes: number
  adjustment?: {
    model: string
    actualCost: number
    baseCost: number
    adjustedMinutes: number
  }
}> {
  const supabase = createActionClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('plan, industry, onboarding_data')
    .eq('id', organizationId)
    .single()

  if (error || !org) {
    return { baseMinutes: 0, effectiveMinutes: 0 }
  }

  // Get base minutes from plan
  const industryPricing = getIndustryPricing(
    org.plan as 'starter' | 'growth' | 'pro' | null,
    org.industry as IndustrySlug | null
  )
  
  const baseMinutes = industryPricing?.minutes || 0

  // Check for cost adjustment in metadata
  const metadata = (org.onboarding_data as any) || {}
  const adjustment = metadata.assistantCostAdjustment

  if (adjustment && adjustment.adjustedMinutes) {
    return {
      baseMinutes,
      effectiveMinutes: adjustment.adjustedMinutes,
      adjustment: {
        model: adjustment.model,
        actualCost: adjustment.actualCost,
        baseCost: adjustment.baseCost,
        adjustedMinutes: adjustment.adjustedMinutes,
      },
    }
  }

  return { baseMinutes, effectiveMinutes: baseMinutes }
}

