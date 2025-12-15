import { NextRequest, NextResponse } from 'next/server'
import { createActionClient } from '@/lib/supabase/server'
import { syncCrmData } from '@/lib/crm/sync-service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createActionClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { crmIntegrationId, organizationId } = body

    // Verify user has access
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', session.user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify CRM integration belongs to organization
    const { data: integration } = await supabase
      .from('crm_integrations')
      .select('organization_id')
      .eq('id', crmIntegrationId)
      .eq('organization_id', organizationId)
      .single()

    if (!integration) {
      return NextResponse.json({ error: 'CRM integration not found' }, { status: 404 })
    }

    // Sync data
    const result = await syncCrmData(crmIntegrationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Sync failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    })
  } catch (error: any) {
    console.error('Error syncing CRM:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync CRM' },
      { status: 500 }
    )
  }
}

