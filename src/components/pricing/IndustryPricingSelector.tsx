'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Star, Zap, Crown, Clock } from 'lucide-react'
import { getAllIndustries, getIndustryBySlug, type IndustrySlug } from '@/lib/industries/config'
import { STRIPE_PLANS, type PlanType } from '@/lib/stripe/server'

// Always return base pricing - same for all industries
function getIndustryPricing(plan: PlanType, industrySlug: IndustrySlug | null) {
  // Always use base prices from STRIPE_PLANS - same for all industries
  return {
    price: STRIPE_PLANS[plan].price, // Always $149, $349, or $699
    minutes: 0, // Minutes are tracked separately, not shown in base pricing
    overageRate: 0.20, // Standard overage rate for all
    avgCallDuration: 5,
  }
}
import { UpgradeButton } from '@/components/pricing/UpgradeButton'
import { StartTrialButton } from '@/components/trial/StartTrialButton'

const PLAN_ICONS = {
  starter: Zap,
  growth: Star,
  pro: Crown,
}

interface IndustryPricingSelectorProps {
  currentPlan: PlanType | null
  organizationId: string
  canStartTrial: boolean
  hasUsedTrial: boolean
  isOnTrial: boolean
  trialPlan: string | null
  defaultIndustry?: IndustrySlug | null
  starterPlanBlocked?: boolean
}

export function IndustryPricingSelector({
  currentPlan,
  organizationId,
  canStartTrial,
  hasUsedTrial,
  isOnTrial,
  trialPlan,
  defaultIndustry,
  starterPlanBlocked = false,
}: IndustryPricingSelectorProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustrySlug | null>(defaultIndustry || null)
  const industries = getAllIndustries()

  const getPlanFeatures = (plan: PlanType) => {
    if (plan === 'starter') {
      return [
        'Unlimited inbound AI calls',
        'Lead capture & management',
        'Call recordings & transcripts',
        'SMS notifications',
        'Basic analytics',
        'Email support',
        'Setup fee credited after 6 months',
      ]
    }

    if (plan === 'growth') {
      return [
        'Everything in Starter',
        'Outbound AI calling',
        '3 active campaigns',
        'Campaign contact management',
        'Advanced analytics',
        'Priority support',
        'Setup fee credited after 6 months',
      ]
    }

    // Pro plan
    return [
      'Everything in Growth',
      'High-volume outbound calling',
      'Unlimited campaigns',
      'Multi-location support',
      'Custom AI voice & scripts',
      'API access',
      'Dedicated account manager',
      'Setup fee credited after 6 months',
    ]
  }

  return (
    <div className="space-y-6">
      {/* Pricing Cards - Always visible, same pricing for all industries */}
      <div className="grid gap-6 lg:grid-cols-3">
        {(Object.entries(STRIPE_PLANS) as [PlanType, typeof STRIPE_PLANS[PlanType]][]).map(([key, plan]) => {
            // Skip starter plan if blocked
            if (key === 'starter' && starterPlanBlocked) {
              return null
            }
            const Icon = PLAN_ICONS[key]
            const isCurrentPlan = currentPlan === key
            const isUpgrade = currentPlan && 
              Object.keys(STRIPE_PLANS).indexOf(key) > Object.keys(STRIPE_PLANS).indexOf(currentPlan)
            const isDowngrade = currentPlan && 
              Object.keys(STRIPE_PLANS).indexOf(key) < Object.keys(STRIPE_PLANS).indexOf(currentPlan)

            // Always use base pricing - same for all industries
            const displayPrice = STRIPE_PLANS[key].price

            return (
              <Card 
                key={key} 
                className={`relative flex flex-col ${
                  plan.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : ''
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge variant="outline" className="absolute -top-3 right-4">
                    Current Plan
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-4">
                    <span className="text-4xl font-bold">${displayPrice}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-center mb-4 pb-4 border-b">
                    <div className="text-sm text-muted-foreground mb-1">
                      One-time setup fee: <span className="font-semibold text-foreground">${plan.setupFee}</span>
                    </div>
                    <div className="text-xs space-y-1">
                      {key === 'starter' && canStartTrial
                        ? <div className="text-muted-foreground">Fully refunded if you cancel during trial</div>
                        : key === 'starter' && isOnTrial && trialPlan === key
                          ? <div className="text-muted-foreground">No setup fee when converting from trial</div>
                          : key !== 'starter'
                            ? <div className="text-muted-foreground">Required to access outbound features</div>
                            : null
                      }
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {getPlanFeatures(key).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2 pt-2 border-t">
                      <Check className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-teal-700">
                        CRM & Calendar Integration (included in setup)
                      </span>
                    </li>
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : isDowngrade ? (
                    <Button variant="outline" className="w-full" disabled>
                      Contact to Downgrade
                    </Button>
                  ) : canStartTrial && key === 'starter' ? (
                    <StartTrialButton
                      organizationId={organizationId}
                      canStartTrial={canStartTrial}
                      hasUsedTrial={hasUsedTrial}
                      trialPlan="starter"
                      planName={plan.name}
                    />
                  ) : (
                    <UpgradeButton 
                      planKey={key} 
                      planName={plan.name}
                      isUpgrade={!!isUpgrade}
                      isOnTrial={isOnTrial}
                      trialPlan={trialPlan}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}

