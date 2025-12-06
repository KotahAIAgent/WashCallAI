import Stripe from 'stripe'

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
    description: 'Perfect for getting started with AI-powered inbound calls',
    features: [
      'Unlimited inbound AI calls',
      'Lead capture & management',
      'Call recordings & transcripts',
      'SMS notifications',
      'Basic analytics',
      'Email support',
    ],
    limits: {
      inboundCalls: -1, // -1 = unlimited
      outboundCalls: 0,
      campaigns: 0,
    },
    popular: false,
  },
  growth: {
    name: 'Growth',
    price: 349,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_test',
    description: 'Scale your business with outbound AI calling',
    features: [
      'Everything in Starter',
      '500 outbound AI calls/month',
      '3 active campaigns',
      'Campaign contact management',
      'Advanced analytics',
      'Priority support',
    ],
    limits: {
      inboundCalls: -1,
      outboundCalls: 500,
      campaigns: 3,
    },
    popular: true,
  },
  pro: {
    name: 'Pro',
    price: 699,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_test',
    description: 'Unlimited power for high-volume operations',
    features: [
      'Everything in Growth',
      '2,500 outbound AI calls/month',
      'Unlimited campaigns',
      'Multi-location support',
      'Custom AI voice & scripts',
      'API access',
      'Dedicated account manager',
    ],
    limits: {
      inboundCalls: -1,
      outboundCalls: 2500,
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
      return planConfig.limits.outboundCalls !== 0
    case 'campaigns':
      return planConfig.limits.campaigns !== 0
    default:
      return false
  }
}

// Get remaining outbound calls for a plan
export function getOutboundLimit(plan: PlanType): number {
  return STRIPE_PLANS[plan]?.limits.outboundCalls || 0
}
