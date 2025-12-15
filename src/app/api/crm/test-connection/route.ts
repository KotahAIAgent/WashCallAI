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
      crmType,
      apiEndpoint,
      apiKey,
      apiSecret,
      authType,
      config,
    } = body

    // Test connection
    const connector = createCrmConnector(crmType, {
      apiEndpoint,
      apiKey,
      apiSecret,
      authType: authType || 'api_key',
      config: config || {},
    })

    const testResult = await connector.testConnection()

    return NextResponse.json(testResult)
  } catch (error: any) {
    console.error('Error testing CRM connection:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}

