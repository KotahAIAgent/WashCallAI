import { createServerClient } from '@/lib/supabase/server'
import { PhoneNumberCatalog } from '@/components/phone-numbers/PhoneNumberCatalog'

export default async function PhoneNumbersPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Not authenticated</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.organization_id) {
    return <div>No organization found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Purchase Phone Numbers</h2>
        <p className="text-muted-foreground">
          Browse and purchase phone numbers for your organization
        </p>
      </div>

      <PhoneNumberCatalog organizationId={profile.organization_id} />
    </div>
  )
}

