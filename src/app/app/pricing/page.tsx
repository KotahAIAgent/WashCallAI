import { createServerClient } from '@/lib/supabase/server'
import { STRIPE_PLANS, PlanType } from '@/lib/stripe/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Sparkles } from 'lucide-react'
import { StartTrialButton } from '@/components/trial/StartTrialButton'
import { IndustryPricingSelector } from '@/components/pricing/IndustryPricingSelector'
import type { IndustrySlug } from '@/lib/industries/config'
import { isStarterPlanBlocked } from '@/lib/admin/utils'


export default async function PricingPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  let currentPlan: PlanType | null = null
  let organizationId = ''
  let isOnTrial = false
  let trialDaysRemaining = 0
  let canStartTrial = false
  let hasUsedTrial = false
  let trialPlan: string | null = null
  let organizationIndustry: IndustrySlug | null = null
  let starterPlanBlocked = false

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
        .select('plan, trial_ends_at, trial_used, trial_plan, industry, admin_privileges')
        .eq('id', profile.organization_id)
        .single()

      currentPlan = org?.plan as PlanType || null
      hasUsedTrial = org?.trial_used || false
      trialPlan = org?.trial_plan as string | null
      organizationIndustry = (org?.industry as IndustrySlug) || null
      starterPlanBlocked = org ? isStarterPlanBlocked(org) : false
      
      // Calculate trial status
      if (org?.trial_ends_at) {
        const trialEnd = new Date(org.trial_ends_at)
        const now = new Date()
        isOnTrial = now < trialEnd
        trialDaysRemaining = isOnTrial 
          ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0
      }

      // Can start trial if never used and no paid plan, and starter plan is not blocked
      canStartTrial = !hasUsedTrial && !currentPlan && !starterPlanBlocked
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
                Start your <strong>7-day free trial</strong> and experience the full power of FusionCaller. 
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
                ✓ Unlimited inbound calls &nbsp; ✓ Lead capture &nbsp; ✓ No credit card required
                <br />
                <span className="text-amber-600">Note: Outbound features require Growth or Pro subscription</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Simple, transparent pricing. All plans include unlimited inbound calls. 
          Choose the plan that fits your business needs.
        </p>
      </div>

      <IndustryPricingSelector
        currentPlan={currentPlan}
        organizationId={organizationId}
        canStartTrial={canStartTrial}
        hasUsedTrial={hasUsedTrial}
        isOnTrial={isOnTrial}
        trialPlan={trialPlan}
        defaultIndustry={organizationIndustry}
        starterPlanBlocked={starterPlanBlocked}
      />

      {/* FAQ / Info */}
      <div className="max-w-3xl mx-auto space-y-6 pt-8">
        <h3 className="text-xl font-semibold text-center">Frequently Asked Questions</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What happens if I exceed my minutes?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Additional minutes are charged at $0.20/minute. You'll receive notifications as you 
              approach your limit, and can upgrade anytime to a higher plan with more included minutes.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">How does minute-based billing work?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You're billed based on actual talk time, not just call count. This ensures fair pricing 
              - you pay for what you use. All inbound calls are unlimited on all plans.
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">What's the setup fee for?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              The one-time setup fee covers custom AI agent creation, CRM integration (HubSpot, Salesforce, etc.), 
              calendar sync (Google Calendar, Outlook), and business customization. Fully refunded if you cancel during your 7-day trial.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Which CRMs and calendars are supported?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              We integrate with most popular CRMs (HubSpot, Salesforce, Pipedrive, Zoho) and calendars 
              (Google Calendar, Outlook, Calendly). Contact us if you need a specific integration.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

