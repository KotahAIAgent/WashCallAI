/**
 * Recommended Assistant Settings
 * Based on the reference VAPI assistant configuration
 */

export const BASE_COST_PER_MINUTE = 0.11 // Base cost for recommended settings

export interface RecommendedSettings {
  model: string
  voiceId: string
  voiceName: string
  firstMessage: string
  systemPrompt?: string
  temperature?: number
  costPerMinute: number
}

/**
 * Get recommended settings for inbound assistants
 */
export function getRecommendedInboundSettings(): RecommendedSettings {
  return {
    model: 'gpt-3.5-turbo',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Default professional voice
    voiceName: 'Rachel',
    firstMessage: 'Thank you for calling! How can I help you today?',
    temperature: 0.7,
    costPerMinute: BASE_COST_PER_MINUTE,
  }
}

/**
 * Get recommended settings for outbound assistants
 */
export function getRecommendedOutboundSettings(): RecommendedSettings {
  return {
    model: 'gpt-3.5-turbo',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Default professional voice
    voiceName: 'Rachel',
    firstMessage: 'Hello! This is {{company_name}}. I\'m calling to follow up with you today.',
    temperature: 0.7,
    costPerMinute: BASE_COST_PER_MINUTE,
  }
}

/**
 * Calculate cost per minute based on model and voice selection
 */
export function calculateAssistantCost(model: string, voiceId?: string): number {
  let baseCost = BASE_COST_PER_MINUTE

  // Model cost multipliers (approximate VAPI pricing)
  const modelMultipliers: Record<string, number> = {
    'gpt-3.5-turbo': 1.0,      // Base cost
    'gpt-4': 1.5,               // ~50% more expensive
    'gpt-4-turbo': 1.3,         // ~30% more expensive
  }

  const multiplier = modelMultipliers[model] || 1.0
  baseCost = BASE_COST_PER_MINUTE * multiplier

  // Voice costs are generally the same for standard voices
  // Premium voices might cost more, but we'll assume standard for now

  return Number(baseCost.toFixed(2))
}

/**
 * Calculate adjusted minutes based on cost per minute
 * If the assistant costs more than base, reduce the available minutes proportionally
 */
export function calculateAdjustedMinutes(
  baseMinutes: number,
  baseCostPerMinute: number,
  actualCostPerMinute: number
): number {
  if (actualCostPerMinute <= baseCostPerMinute) {
    return baseMinutes // No adjustment needed if cost is same or less
  }

  // Calculate how many minutes they can use with the higher cost
  // Example: 1000 minutes at $0.11/min = $110 budget
  // At $0.165/min ($0.11 * 1.5), they get 110 / 0.165 = 666 minutes
  const budget = baseMinutes * baseCostPerMinute
  const adjustedMinutes = Math.floor(budget / actualCostPerMinute)

  return adjustedMinutes
}

