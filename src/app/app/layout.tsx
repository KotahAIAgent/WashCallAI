import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import { SubscriptionGate } from '@/components/onboarding/SubscriptionGate'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { TourProvider } from '@/components/onboarding/OnboardingTour'
import { createServerClient } from '@/lib/supabase/server'

// Add your admin email(s) here - keep in sync with admin/page.tsx
const ADMIN_EMAILS = [
  'admin@washcallai.com',
  // Add your email here
]

type SetupStatus = 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email || '')

  // Get organization status for subscription gate
  let organizationId = ''
  let onboardingCompleted = false
  let hasPlan = false
  let setupStatus: SetupStatus = 'pending'
  // Trial status
  let isOnTrial = false
  let trialDaysRemaining = 0
  let trialEndsAt: string | null = null
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
        .select('onboarding_completed, plan, setup_status, trial_started_at, trial_ends_at, trial_used')
        .eq('id', profile.organization_id)
        .single()

      onboardingCompleted = org?.onboarding_completed || false
      hasPlan = !!org?.plan && org.plan !== null
      setupStatus = (org?.setup_status as SetupStatus) || 'pending'

      // Calculate trial status
      hasUsedTrial = org?.trial_used || false
      trialEndsAt = org?.trial_ends_at || null
      
      if (trialEndsAt) {
        const trialEnd = new Date(trialEndsAt)
        const now = new Date()
        isOnTrial = now < trialEnd
        trialDaysRemaining = isOnTrial 
          ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0
      }

      // Can start trial if never used and no paid plan
      canStartTrial = !hasUsedTrial && !hasPlan
    }
  }

  // Admins bypass subscription gate
  if (isAdmin) {
    onboardingCompleted = true
    hasPlan = true
    setupStatus = 'active'
    isOnTrial = false // Admins don't need trial
  }

  const userId = session?.user?.id || ''

  return (
    <ThemeProvider>
      <TourProvider>
        <OrganizationProvider>
          <div className="h-screen flex overflow-hidden bg-background">
            <Sidebar isAdmin={isAdmin} />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Topbar isAdmin={isAdmin} userId={userId} />
              <main className="flex-1 relative overflow-y-auto focus:outline-none">
                <div className="py-6">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <SubscriptionGate
                      organizationId={organizationId}
                      onboardingCompleted={onboardingCompleted}
                      hasPlan={hasPlan}
                      setupStatus={setupStatus}
                      isOnTrial={isOnTrial}
                      trialDaysRemaining={trialDaysRemaining}
                      trialEndsAt={trialEndsAt}
                      canStartTrial={canStartTrial}
                      hasUsedTrial={hasUsedTrial}
                    >
                      {children}
                    </SubscriptionGate>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </OrganizationProvider>
      </TourProvider>
    </ThemeProvider>
  )
}
