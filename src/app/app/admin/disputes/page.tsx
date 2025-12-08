import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllDisputes } from '@/lib/disputes/actions'
import { AdminDisputesList } from '@/components/admin/AdminDisputesList'
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'

// Admin emails - keep in sync with layout.tsx and admin/page.tsx
const ADMIN_EMAILS = [
  'admin@washcallai.com',
  'dakkota@dshpressure.com',
]

export default async function AdminDisputesPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Check if user is admin
  const isAdmin = ADMIN_EMAILS.includes(session.user.email || '')
  if (!isAdmin) {
    redirect('/app/dashboard')
  }

  // Fetch all disputes
  const { disputes, error } = await getAllDisputes()

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading disputes: {error}</p>
      </div>
    )
  }

  // Calculate stats
  const pendingCount = disputes?.filter(d => d.status === 'pending').length || 0
  const approvedCount = disputes?.filter(d => d.status === 'approved').length || 0
  const deniedCount = disputes?.filter(d => d.status === 'denied').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dispute Management</h1>
        <p className="text-muted-foreground">
          Review and resolve customer call disputes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disputes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className={pendingCount > 0 ? 'border-yellow-200 bg-yellow-50/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className={`h-4 w-4 ${pendingCount > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            {pendingCount > 0 && (
              <p className="text-xs text-yellow-600 mt-1">Needs attention</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deniedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Disputes</CardTitle>
          <CardDescription>
            Click on a dispute to review the call details and make a decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminDisputesList 
            disputes={disputes || []} 
            adminEmail={session.user.email || ''} 
          />
        </CardContent>
      </Card>
    </div>
  )
}

