import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { CrmIntegrationCard } from '@/components/integrations/CrmIntegrationCard'
import { FormWebhookCard } from '@/components/integrations/FormWebhookCard'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Integrations | FusionCaller',
  description: 'Manage your integrations and webhooks.',
}

async function getCrmIntegrations(organizationId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('crm_integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .order('created_at', { ascending: false })
  
  return data || []
}

export default async function IntegrationsPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    redirect('/app/dashboard')
  }

  const crmIntegrations = await getCrmIntegrations(profile.organization_id)
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusioncaller.com'}/api/webhooks/form-submission?orgId=${profile.organization_id}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your tools and automate your workflow
        </p>
      </div>

      {/* Form Webhook Section */}
      <FormWebhookCard webhookUrl={webhookUrl} />

      {/* CRM Integration Section */}
      <CrmIntegrationCard
        organizationId={profile.organization_id}
        integrations={crmIntegrations}
      />
    </div>
  )
}

