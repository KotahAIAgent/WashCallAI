'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Star, Zap, Crown, Clock } from 'lucide-react'
import { getAllIndustries, getIndustryBySlug, type IndustrySlug } from '@/lib/industries/config'
import { STRIPE_PLANS, type PlanType } from '@/lib/stripe/server'

// Client-side version of getIndustryPricing
function getIndustryPricing(plan: PlanType, industrySlug: IndustrySlug | null) {
  if (!industrySlug) {
    return {
      price: STRIPE_PLANS[plan].price,
      minutes: 0,
      overageRate: 0.20,
      avgCallDuration: 5,
    }
  }

  const industry = getIndustryBySlug(industrySlug)
  if (!industry) {
    return {
      price: STRIPE_PLANS[plan].price,
      minutes: 0,
      overageRate: 0.20,
      avgCallDuration: 5,
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

  const getPlanFeatures = (plan: PlanType, industrySlug: IndustrySlug | null) => {
    const basePlan = STRIPE_PLANS[plan]
    const industryPricing = industrySlug ? getIndustryPricing(plan, industrySlug) : null

    if (plan === 'starter') {
      return [
        'Unlimited inbound AI calls',
        industryPricing ? `${industryPricing.minutes.toLocaleString()} outbound minutes/month` : 'Lead capture & management',
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
        industryPricing ? `${industryPricing.minutes.toLocaleString()} outbound minutes/month included` : 'Outbound AI calling',
        industryPricing ? `Overage: $${industryPricing.overageRate}/minute after included minutes` : '3 active campaigns',
        'Campaign contact management',
        'Advanced analytics',
        'Priority support',
        'Setup fee credited after 6 months',
      ]
    }

    // Pro plan
    return [
      'Everything in Growth',
      industryPricing ? `${industryPricing.minutes.toLocaleString()} outbound minutes/month included` : 'High-volume outbound calling',
      industryPricing ? `Overage: $${industryPricing.overageRate}/minute after included minutes` : 'Unlimited campaigns',
      'Multi-location support',
      'Custom AI voice & scripts',
      'API access',
      'Dedicated account manager',
      'Setup fee credited after 6 months',
    ]
  }

  return (
    <div className="space-y-6">
      {/* Industry Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Industry</CardTitle>
          <CardDescription>
            Pricing is customized based on average call duration and usage patterns for your industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedIndustry || undefined}
            onValueChange={(value) => setSelectedIndustry(value as IndustrySlug)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose your industry..." />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry.slug} value={industry.slug}>
                  {industry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedIndustry && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Average call duration:</strong> {getIndustryBySlug(selectedIndustry)?.pricing.avgCallDuration} minutes
                <br />
                <strong>Overage rate:</strong> ${getIndustryBySlug(selectedIndustry)?.pricing.overageRate}/minute after included minutes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Cards */}
      {selectedIndustry && (
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

            const industryPricing = getIndustryPricing(key, selectedIndustry)
            const industry = getIndustryBySlug(selectedIndustry)

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
                    <span className="text-4xl font-bold">${industryPricing.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-center mb-4 pb-4 border-b">
                    <div className="text-sm text-muted-foreground mb-1">
                      One-time setup fee: <span className="font-semibold text-foreground">${plan.setupFee}</span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="text-primary font-semibold flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {industryPricing.minutes.toLocaleString()} minutes included
                      </div>
                      {key === 'starter' && canStartTrial
                        ? <div className="text-muted-foreground">Fully refunded if you cancel during trial</div>
                        : key === 'starter' && isOnTrial && trialPlan === key
                          ? <div className="text-muted-foreground">No setup fee when converting from trial</div>
                          : <div className="text-muted-foreground">Required to access outbound features</div>
                      }
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {getPlanFeatures(key, selectedIndustry).map((feature, i) => (
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
      )}

      {!selectedIndustry && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Please select your industry above to view customized pricing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

