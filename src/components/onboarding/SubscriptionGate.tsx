'use client'

import { ReactNode } from 'react'
import { OnboardingForm } from './OnboardingForm'
import { SetupStatusBanner } from './SetupStatusBanner'
import { TrialBanner } from '@/components/trial/TrialBanner'
import { StartTrialButton } from '@/components/trial/StartTrialButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Eye, Sparkles, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type SetupStatus = 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'

interface SubscriptionGateProps {
  children: ReactNode
  organizationId: string
  onboardingCompleted: boolean
  hasPlan: boolean
  setupStatus: SetupStatus
  // Trial props
  isOnTrial?: boolean
  trialDaysRemaining?: number
  trialEndsAt?: string | null
  canStartTrial?: boolean
  hasUsedTrial?: boolean
}

// Pages that don't require a plan to access (but with restrictions)
const FREE_ACCESS_PAGES = ['/app/pricing', '/app/settings', '/app/help', '/app/disputes']

export function SubscriptionGate({ 
  children, 
  organizationId, 
  onboardingCompleted, 
  hasPlan,
  setupStatus = 'pending',
  isOnTrial = false,
  trialDaysRemaining = 0,
  trialEndsAt = null,
  canStartTrial = false,
  hasUsedTrial = false,
}: SubscriptionGateProps) {
  const pathname = usePathname()
  
  // Allow access to pricing and settings without restrictions
  if (FREE_ACCESS_PAGES.includes(pathname)) {
    return <>{children}</>
  }

  // If user hasn't completed onboarding, show the form
  if (!onboardingCompleted) {
    return <OnboardingForm organizationId={organizationId} />
  }

  // If user is on an active trial, give full access with trial banner
  if (isOnTrial && trialEndsAt) {
    return (
      <>
        <TrialBanner daysRemaining={trialDaysRemaining} trialEndsAt={trialEndsAt} />
        {setupStatus !== 'active' && (
          <SetupStatusBanner status={setupStatus} hasPlan={hasPlan} />
        )}
        {children}
      </>
    )
  }

  // If user has completed onboarding but no plan (and no active trial), show preview with upgrade prompt
  if (!hasPlan) {
    return (
      <div className="space-y-6">
        {/* Setup Status Banner */}
        <SetupStatusBanner status={setupStatus} hasPlan={hasPlan} />

        {/* Upgrade or Start Trial Banner (only if ready) */}
        {setupStatus === 'ready' && (
          <Card className="border-primary bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Your AI Agent is Ready! 🎉</h3>
                    <p className="text-muted-foreground">
                      {canStartTrial 
                        ? 'Start your free 7-day trial or choose a plan to go live. Setup fee fully refunded if you cancel during trial.'
                        : hasUsedTrial
                          ? 'Your trial has ended. Subscribe to continue using NeverMiss AI.'
                          : 'Choose a plan to start receiving AI-powered calls today. Setup includes CRM & Calendar integration.'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {canStartTrial && (
                    <StartTrialButton 
                      organizationId={organizationId}
                      canStartTrial={canStartTrial}
                      hasUsedTrial={hasUsedTrial}
                    />
                  )}
                  <Link href="/app/pricing">
                    <Button size="lg" variant={canStartTrial ? 'outline' : 'default'} className="whitespace-nowrap">
                      {canStartTrial ? 'View Plans' : 'Subscribe Now'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial Expired Banner */}
        {hasUsedTrial && !hasPlan && !isOnTrial && (
          <Card className="border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-300">Your free trial has expired</p>
                  <p className="text-sm text-red-600 dark:text-red-400">Subscribe now to restore access to your AI agents.</p>
                </div>
                <Link href="/app/pricing">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Subscribe Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview Mode Notice */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <Eye className="h-4 w-4" />
          <span>
            <strong>Preview Mode:</strong> You can explore the dashboard, but features are locked until you subscribe.
          </span>
        </div>

        {/* Locked Content Overlay */}
        <div className="relative">
          {/* Actual Content (blurred/disabled) */}
          <div className="opacity-50 pointer-events-none select-none filter blur-[1px]">
            {children}
          </div>

          {/* Floating Lock Card */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="max-w-md shadow-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 p-3 rounded-full bg-gray-100 w-fit">
                  <Lock className="h-8 w-8 text-gray-500" />
                </div>
                <CardTitle>
                  {setupStatus === 'ready' ? 'Ready to Go Live!' : 'Setup In Progress'}
                </CardTitle>
                <CardDescription>
                  {setupStatus === 'ready' 
                    ? 'Your AI agent is ready. Subscribe to unlock all features.'
                    : 'We\'re setting up your AI agent. You\'ll be notified when it\'s ready!'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/app/pricing">
                  <Button>
                    {setupStatus === 'ready' ? 'Choose a Plan' : 'View Plans'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground mt-3">
                  Start with unlimited inbound calls at $149/month + $99 setup fee
                  <br />
                  <span className="text-teal-600">Setup includes CRM & Calendar integration</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // User has a plan - show content with status banner if not fully active
  return (
    <>
      {setupStatus !== 'active' && (
        <SetupStatusBanner status={setupStatus} hasPlan={hasPlan} />
      )}
      {children}
    </>
  )
}
