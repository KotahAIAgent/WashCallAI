import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Users, Phone, Bot, Clock, RefreshCw } from 'lucide-react'
import { AdminOrganizationList } from '@/components/admin/AdminOrganizationList'
import { AdminAddPhoneNumber } from '@/components/admin/AdminAddPhoneNumber'
import { AdminUpdatePhoneNumber } from '@/components/admin/AdminUpdatePhoneNumber'
import { AdminSetAgent } from '@/components/admin/AdminSetAgent'
import { AdminUpdateStatus } from '@/components/admin/AdminUpdateStatus'
import { RefreshButton } from '@/components/admin/RefreshButton'

// Add your admin email(s) here
const ADMIN_EMAILS = [
  'admin@washcallai.com',
  'dakkota@dshpressure.com',
]

async function getAllOrganizations() {
  try {
    // Check if service role key is configured before attempting to create client
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const error = 'SUPABASE_SERVICE_ROLE_KEY is not configured. Please add it to your .env.local file.'
      console.error('[Admin]', error)
      throw new Error(error)
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const error = 'NEXT_PUBLIC_SUPABASE_URL is not configured. Please add it to your .env.local file.'
      console.error('[Admin]', error)
      throw new Error(error)
    }

    // Use service role client to bypass RLS for admin queries
    const supabase = createServiceRoleClient()
    
    // First, get all organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgError) {
      console.error('[Admin] Error fetching organizations:', orgError)
      console.error('[Admin] Error details:', JSON.stringify(orgError, null, 2))
      return []
    }

    console.log(`[Admin] Found ${orgs?.length || 0} organizations`)

    if (!orgs || orgs.length === 0) {
      console.log('[Admin] No organizations found in database')
      return []
    }

    // Then get related data for each organization
    const orgIds = orgs.map(org => org.id)
    
    // Get agent configs
    const { data: agentConfigs, error: agentError } = await supabase
      .from('agent_configs')
      .select('*')
      .in('organization_id', orgIds)

    if (agentError) {
      console.error('[Admin] Error fetching agent_configs:', agentError)
    }

    // Get phone numbers
    const { data: phoneNumbers, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('*')
      .in('organization_id', orgIds)

    if (phoneError) {
      console.error('[Admin] Error fetching phone_numbers:', phoneError)
    }

    // Get profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, organization_id')
      .in('organization_id', orgIds)

    if (profileError) {
      console.error('[Admin] Error fetching profiles:', profileError)
    }

    // Combine the data
    const result = orgs.map(org => ({
      ...org,
      agent_configs: agentConfigs?.filter(ac => ac.organization_id === org.id) || [],
      phone_numbers: phoneNumbers?.filter(pn => pn.organization_id === org.id) || [],
      profiles: profiles?.filter(p => p.organization_id === org.id) || [],
    }))

    console.log(`[Admin] Returning ${result.length} organizations with related data`)
    return result
  } catch (error) {
    console.error('[Admin] Fatal error in getAllOrganizations:', error)
    return []
  }
}

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if user is admin
  const isAdmin = ADMIN_EMAILS.includes(session.user.email || '')
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  let organizations: any[] = []
  let errorMessage: string | null = null

  // Check if service role key is configured FIRST
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errorMessage = `SUPABASE_SERVICE_ROLE_KEY is not set. ${
      process.env.NODE_ENV === 'production' 
        ? 'Please add it to Vercel environment variables (Settings → Environment Variables) and redeploy.' 
        : 'Please add it to your .env.local file and restart your development server.'
    }`
  } else {
    try {
      organizations = await getAllOrganizations()
      console.log(`[Admin] Page render - ${organizations.length} organizations`)
    } catch (error: any) {
      console.error('[Admin] Error loading organizations:', error)
      errorMessage = error?.message || 'Failed to load organizations'
      
      // If it's a configuration error, provide more helpful message
      if (error?.message?.includes('SUPABASE_SERVICE_ROLE_KEY') || error?.message?.includes('Missing Supabase service role credentials')) {
        errorMessage = process.env.NODE_ENV === 'production'
          ? 'SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel. Please add it to Environment Variables and redeploy.'
          : 'SUPABASE_SERVICE_ROLE_KEY is not configured. Please add it to your .env.local file and restart your development server.'
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Panel
          </h2>
          <p className="text-muted-foreground">
            Manage organizations, agents, and phone numbers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton />
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Pending Setups</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {organizations.filter(o => 
                o.onboarding_completed && 
                o.setup_status && 
                !['ready', 'active'].includes(o.setup_status)
              ).length}
            </div>
            <p className="text-xs text-amber-600 mt-1">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Configured Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(o => o.agent_configs?.[0]?.inbound_agent_id || o.agent_configs?.[0]?.outbound_agent_id).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phone Numbers</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((acc, o) => acc + (o.phone_numbers?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AdminUpdateStatus organizations={organizations} />
        <AdminSetAgent organizations={organizations} />
        <AdminAddPhoneNumber organizations={organizations} />
        <AdminUpdatePhoneNumber organizations={organizations} />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <Shield className="h-5 w-5" />
              <div className="flex-1">
                <p className="font-semibold">Configuration Error</p>
                <p className="text-sm mt-1">{errorMessage}</p>
                <div className="mt-3 p-3 bg-red-100 rounded text-xs">
                  <p className="font-semibold mb-1">Debug Info:</p>
                  <p>Environment: {process.env.NODE_ENV || 'unknown'}</p>
                  <p>Service Role Key Set: {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'}</p>
                  <p>Supabase URL Set: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Yes' : 'No'}</p>
                </div>
                <p className="text-xs mt-2 text-red-600">
                  If you're on production, make sure SUPABASE_SERVICE_ROLE_KEY is added to Vercel environment variables and you've redeployed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List */}
      <AdminOrganizationList organizations={organizations} />
    </div>
  )
}

