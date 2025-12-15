import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STRIPE_PLANS } from '@/lib/stripe/server'
import { CreditCard, Bell, Building2, Briefcase, User, Mail, Phone } from 'lucide-react'
import { ManageBillingButton } from '@/components/settings/ManageBillingButton'
import { UpdateOrganizationForm } from '@/components/organization/UpdateOrganizationForm'
import { NotificationSettingsForm } from '@/components/settings/NotificationSettingsForm'
import { BusinessPreferencesForm } from '@/components/settings/BusinessPreferencesForm'
import { EmailReportsToggle } from '@/components/settings/EmailReportsToggle'
import { CreditBalance } from '@/components/settings/CreditBalance'
import { AddPhoneNumberForm } from '@/components/settings/AddPhoneNumberForm'

async function getOrganization(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()

  return data
}

async function getPhoneNumbers(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('phone_numbers')
    .select('id, phone_number, friendly_name, type')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .order('created_at', { ascending: false })

  return data || []
}

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No organization found</div>
  }

  const [organization, phoneNumbers] = await Promise.all([
    getOrganization(profile.organization_id),
    getPhoneNumbers(profile.organization_id)
  ])
  
  const currentPlan = organization?.plan || null
  const planDetails = currentPlan ? STRIPE_PLANS[currentPlan as keyof typeof STRIPE_PLANS] : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account, business preferences, and billing
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Phone Numbers</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">AI Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Profile
              </CardTitle>
              <CardDescription>
                Update your business information, service areas, hours, and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization && <UpdateOrganizationForm organization={organization} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phone Numbers Tab */}
        <TabsContent value="phone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Purchase Phone Numbers
              </CardTitle>
              <CardDescription>
                Browse and purchase phone numbers for your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Looking to purchase a new phone number? Browse our catalog of available numbers.
              </p>
              <Button asChild>
                <a href="/app/phone-numbers">Browse Phone Number Catalog</a>
              </Button>
            </CardContent>
          </Card>

          <AddPhoneNumberForm />
          
          {phoneNumbers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Phone Numbers</CardTitle>
                <CardDescription>
                  Phone numbers currently configured for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phoneNumbers.map((phone) => (
                    <div key={phone.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{phone.phone_number}</p>
                        {phone.friendly_name && (
                          <p className="text-sm text-muted-foreground">{phone.friendly_name}</p>
                        )}
                      </div>
                      <Badge variant="outline">{phone.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Business & AI Preferences
              </CardTitle>
              <CardDescription>
                Update your service offerings and AI agent behavior. Changes here will adjust how your AI handles calls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization && (
                <BusinessPreferencesForm 
                  organizationId={organization.id}
                  onboardingData={organization.onboarding_data}
                  currentServices={organization.services_offered}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                SMS Notifications
              </CardTitle>
              <CardDescription>
                Get instant text alerts when leads call or show interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization && (
                <NotificationSettingsForm 
                  organizationId={organization.id}
                  notificationPhone={organization.notification_phone}
                  notificationSettings={organization.notification_settings}
                  phoneNumbers={phoneNumbers}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Reports
              </CardTitle>
              <CardDescription>
                Receive weekly summaries of your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {organization && (
                <EmailReportsToggle 
                  organizationId={organization.id}
                  emailReportsEnabled={organization.email_reports_enabled ?? true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Credit Balance Card */}
          {organization && (
            <CreditBalance 
              creditAmount={organization.account_credit || 0}
              setupFeeCredited={organization.setup_fee_credited || false}
            />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {planDetails ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Current Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {planDetails.name} - ${planDetails.price}/month
                      </p>
                    </div>
                    <Badge variant="default">{currentPlan}</Badge>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Plan Features</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {planDetails.features.map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <Separator />
                  <ManageBillingButton />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You don't have an active subscription yet.
                  </p>
                  <a href="/app/pricing">
                    <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                      View Plans
                    </button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
