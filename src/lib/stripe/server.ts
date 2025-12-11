import Stripe from 'stripe'
import { getIndustryBySlug, type IndustrySlug } from '@/lib/industries/config'

// Make Stripe optional for builds without the secret key
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  : null as unknown as Stripe // Type assertion for build time

export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    price: 149,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_test',
    setupFee: 99,
    setupFeePriceId: process.env.STRIPE_SETUP_FEE_STARTER_PRICE_ID || 'price_setup_starter_test',
    description: 'Perfect for getting started with AI-powered inbound calls',
    features: [
      'Unlimited inbound AI calls',
      'Lead capture & management',
      'Call recordings & transcripts',
      'SMS notifications',
      'Basic analytics',
      'Email support',
      'Setup fee credited after 6 months',
    ],
    limits: {
      inboundMinutes: -1, // -1 = unlimited
      outboundMinutes: 0,
      campaigns: 0,
    },
    popular: false,
  },
  growth: {
    name: 'Growth',
    price: 349,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_test',
    setupFee: 149,
    setupFeePriceId: process.env.STRIPE_SETUP_FEE_GROWTH_PRICE_ID || 'price_setup_growth_test',
    description: 'Scale your business with outbound AI calling',
    features: [
      'Everything in Starter',
      '500 outbound AI calls/month',
      '3 active campaigns',
      'Campaign contact management',
      'Advanced analytics',
      'Priority support',
      'Setup fee credited after 6 months',
    ],
    limits: {
      inboundMinutes: -1,
      outboundMinutes: 0, // Will be set by industry-specific pricing
      campaigns: 3,
    },
    popular: true,
  },
  pro: {
    name: 'Pro',
    price: 699,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_test',
    setupFee: 199,
    setupFeePriceId: process.env.STRIPE_SETUP_FEE_PRO_PRICE_ID || 'price_setup_pro_test',
    description: 'Unlimited power for high-volume operations',
    features: [
      'Everything in Growth',
      '2,500 outbound AI calls/month',
      'Unlimited campaigns',
      'Multi-location support',
      'Custom AI voice & scripts',
      'API access',
      'Dedicated account manager',
      'Setup fee credited after 6 months',
    ],
    limits: {
      inboundMinutes: -1,
      outboundMinutes: 0, // Will be set by industry-specific pricing
      campaigns: -1,
    },
    popular: false,
  },
} as const

export type PlanType = keyof typeof STRIPE_PLANS

// Check if a plan has access to a feature
export function planHasAccess(plan: PlanType | null, feature: 'outbound' | 'campaigns'): boolean {
  if (!plan) return false
  
  const planConfig = STRIPE_PLANS[plan]
  if (!planConfig) return false
  
  switch (feature) {
    case 'outbound':
      return planConfig.limits.outboundMinutes !== 0
    case 'campaigns':
      return planConfig.limits.campaigns !== 0
    default:
      return false
  }
}

// Get industry-specific pricing for a plan
export function getIndustryPricing(plan: PlanType, industrySlug?: IndustrySlug | null) {
  if (!industrySlug) {
    // Return default/base pricing if no industry specified
    return {
      price: STRIPE_PLANS[plan].price,
      minutes: 0,
      overageRate: 0.20,
    }
  }

  const industry = getIndustryBySlug(industrySlug)
  if (!industry) {
    return {
      price: STRIPE_PLANS[plan].price,
      minutes: 0,
      overageRate: 0.20,
    }
  }

  const pricing = industry.pricing
  return {
    price: pricing[plan],
    minutes: plan === 'starter' ? pricing.starterMinutes : 
             plan === 'growth' ? pricing.growthMinutes : 
             pricing.proMinutes,
    overageRate: pricing.overageRate,
    avgCallDuration: pricing.avgCallDuration,
  }
}

// Get remaining outbound minutes for a plan (industry-specific)
export function getOutboundMinutes(plan: PlanType, industrySlug?: IndustrySlug | null): number {
  if (!industrySlug) return 0
  const industryPricing = getIndustryPricing(plan, industrySlug)
  return industryPricing.minutes
}

// Legacy function for backward compatibility (returns 0 for minutes-based plans)
export function getOutboundLimit(plan: PlanType): number {
  return STRIPE_PLANS[plan]?.limits.outboundMinutes || 0
}

// Get setup fee amount for a plan
export function getSetupFee(plan: PlanType): number {
  return STRIPE_PLANS[plan]?.setupFee || 0
}

// Get setup fee price ID for a plan
export function getSetupFeePriceId(plan: PlanType): string {
  return STRIPE_PLANS[plan]?.setupFeePriceId || ''
}
