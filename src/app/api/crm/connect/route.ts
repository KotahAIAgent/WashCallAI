import { NextRequest, NextResponse } from 'next/server'
import { createActionClient } from '@/lib/supabase/server'
import { createCrmConnector } from '@/lib/crm/connector-factory'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createActionClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      organizationId,
      crmType,
      displayName,
      apiEndpoint,
      apiKey,
      apiSecret,
      authType,
      config,
    } = body

    // Verify user has access
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('profile_id', session.user.id)
      .eq('organization_id', organizationId)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Test connection first
    const connector = createCrmConnector(crmType, {
      apiEndpoint,
      apiKey,
      apiSecret,
      authType: authType || 'api_key',
      config: config || {},
    })

    const testResult = await connector.testConnection()
    if (!testResult.success) {
      return NextResponse.json(
        { error: `Connection test failed: ${testResult.error}` },
        { status: 400 }
      )
    }

    // Save CRM integration
    const { data: integration, error: insertError } = await supabase
      .from('crm_integrations')
      .insert({
        organization_id: organizationId,
        crm_type: crmType,
        display_name: displayName || null,
        api_endpoint: apiEndpoint,
        api_key: apiKey, // TODO: Encrypt this
        api_secret: apiSecret || null, // TODO: Encrypt this
        auth_type: authType || 'api_key',
        config: config || {},
        active: true,
        sync_enabled: true,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      integration,
    })
  } catch (error: any) {
    console.error('Error connecting CRM:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect CRM' },
      { status: 500 }
    )
  }
}

