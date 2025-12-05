import { createServerClient } from '@/lib/supabase/server'
import { STRIPE_PLANS, PlanType } from '@/lib/stripe/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap, Crown, Clock, Sparkles } from 'lucide-react'
import { UpgradeButton } from '@/components/pricing/UpgradeButton'
import { StartTrialButton } from '@/components/trial/StartTrialButton'

const PLAN_ICONS = {
  starter: Zap,
  growth: Star,
  pro: Crown,
}

export default async function PricingPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  let currentPlan: PlanType | null = null
  let organizationId = ''
  let isOnTrial = false
  let trialDaysRemaining = 0
  let canStartTrial = false
  let hasUsedTrial = false

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (profile?.organization_id) {
      organizationId = profile.organization_id
      
      const { data: org } = await supabase
        .from('organizations')
        .select('plan, trial_ends_at, trial_used')
        .eq('id', profile.organization_id)
        .single()

      currentPlan = org?.plan as PlanType || null
      hasUsedTrial = org?.trial_used || false
      
      // Calculate trial status
      if (org?.trial_ends_at) {
        const trialEnd = new Date(org.trial_ends_at)
        const now = new Date()
        isOnTrial = now < trialEnd
        trialDaysRemaining = isOnTrial 
          ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0
      }

      // Can start trial if never used and no paid plan
      canStartTrial = !hasUsedTrial && !currentPlan
    }
  }

  return (
    <div className="space-y-8">
      {/* Trial Status Banner */}
      {isOnTrial && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 to-blue-500/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    🎉 You're on a Free Trial — {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Subscribe now to ensure uninterrupted service when your trial ends.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Trial CTA - Only show if eligible */}
      {canStartTrial && !isOnTrial && (
        <Card className="border-2 border-dashed border-primary/50 bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5">
          <CardContent className="py-8">
            <div className="text-center max-w-xl mx-auto">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 w-fit">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Not Ready to Commit?</h3>
              <p className="text-muted-foreground mb-6">
                Start your <strong>15-day free trial</strong> and experience the full power of WashCall AI. 
                No credit card required. Cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <StartTrialButton 
                  organizationId={organizationId}
                  canStartTrial={canStartTrial}
                  hasUsedTrial={hasUsedTrial}
                  variant="large"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                ✓ Full access to all features &nbsp; ✓ 50 outbound calls included &nbsp; ✓ Priority support
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Start with unlimited inbound AI calls. Upgrade for outbound calling campaigns 
          to proactively grow your pressure washing business.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(Object.entries(STRIPE_PLANS) as [PlanType, typeof STRIPE_PLANS[PlanType]][]).map(([key, plan]) => {
          const Icon = PLAN_ICONS[key]
          const isCurrentPlan = currentPlan === key
          const isUpgrade = currentPlan && 
            Object.keys(STRIPE_PLANS).indexOf(key) > Object.keys(STRIPE_PLANS).indexOf(currentPlan)
          const isDowngrade = currentPlan && 
            Object.keys(STRIPE_PLANS).indexOf(key) < Object.keys(STRIPE_PLANS).indexOf(currentPlan)

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
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button disabled className="w-full">
                    Current Plan
                  </Button>
                ) : isDowngrade ? (
                  <Button variant="outline" className="w-full" disabled>
                    Contact to Downgrade
                  </Button>
                ) : (
                  <UpgradeButton 
                    planKey={key} 
                    planName={plan.name}
                    isUpgrade={!!isUpgrade}
                  />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ / Info */}
      <div className="max-w-3xl mx-auto space-y-6 pt-8">
        <h3 className="text-xl font-semibold text-center">Frequently Asked Questions</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Why is outbound calling premium?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Outbound AI calling requires careful management to maintain call quality and 
              avoid spam flags. We limit access to ensure every customer gets the best results.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What counts as an outbound call?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Each call initiated to a contact in your campaigns counts as one outbound call, 
              regardless of whether it's answered or goes to voicemail.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Can I upgrade anytime?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Yes! Upgrades are instant and you'll be prorated for the remaining billing period. 
              New features are available immediately.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What's included in custom scripts?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Pro plans include personalized AI scripts tailored to your business, service areas, 
              and unique selling points for maximum conversion.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

