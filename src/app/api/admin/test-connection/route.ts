import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    // Check if variables are set
    if (!serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY is not set',
        serviceRoleKeyConfigured: false,
        serviceRoleKeyLength: 0,
        supabaseUrlConfigured: !!supabaseUrl,
        supabaseUrl: supabaseUrl ? 'Set (hidden)' : 'Not set',
        allEnvVars: Object.keys(process.env).filter(k => k.includes('SUPABASE')).map(k => ({
          key: k,
          set: !!process.env[k],
          length: process.env[k]?.length || 0
        }))
      }, { status: 500 })
    }

    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_URL is not set',
        serviceRoleKeyConfigured: true,
        serviceRoleKeyLength: serviceRoleKey.length,
        supabaseUrlConfigured: false,
      }, { status: 500 })
    }

    // Test service role client
    const supabase = createServiceRoleClient()
    
    // Try to fetch organizations
    const { data: orgs, error, count } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' })
      .limit(10)

    return NextResponse.json({
      success: true,
      serviceRoleKeyConfigured: true,
      serviceRoleKeyLength: serviceRoleKey.length,
      supabaseUrlConfigured: true,
      supabaseUrl: supabaseUrl.substring(0, 30) + '...',
      organizationsFound: orgs?.length || 0,
      totalCount: count || 0,
      organizations: orgs || [],
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      } : null
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      serviceRoleKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      supabaseUrlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    }, { status: 500 })
  }
}

