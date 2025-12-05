import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Phone, Bot, Clock } from 'lucide-react'
import { AdminOrganizationList } from '@/components/admin/AdminOrganizationList'
import { AdminAddPhoneNumber } from '@/components/admin/AdminAddPhoneNumber'
import { AdminSetAgent } from '@/components/admin/AdminSetAgent'
import { AdminUpdateStatus } from '@/components/admin/AdminUpdateStatus'

// Add your admin email(s) here
const ADMIN_EMAILS = [
  'admin@washcallai.com',
  // Add your email here
]

async function getAllOrganizations() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('organizations')
    .select(`
      *,
      agent_configs (*),
      phone_numbers (*),
      profiles!profiles_organization_id_fkey (
        id,
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  return data || []
}

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

  const organizations = await getAllOrganizations()

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
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Admin Access
        </Badge>
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
      </div>

      {/* Organizations List */}
      <AdminOrganizationList organizations={organizations} />
    </div>
  )
}

