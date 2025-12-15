import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const organizationId = searchParams.get('orgId')

    if (!query || !organizationId) {
      return NextResponse.json(
        { error: 'Query and organization ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Use PostgreSQL text search with pg_trgm similarity
    // Search in transcripts and summaries
    const { data: calls, error } = await supabase.rpc('search_call_transcripts', {
      search_query: query,
      org_id: organizationId,
      max_results: 50,
    })

    if (error) {
      console.error('Transcript search error:', error)
      
      // Fallback to simple LIKE search if RPC doesn't exist
      const { data: fallbackCalls, error: fallbackError } = await supabase
        .from('calls')
        .select('id, direction, status, created_at, transcript, summary, lead_id, from_number, to_number')
        .eq('organization_id', organizationId)
        .or(`transcript.ilike.%${query}%,summary.ilike.%${query}%`)
        .not('transcript', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50)

      if (fallbackError) {
        return NextResponse.json(
          { error: fallbackError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        results: fallbackCalls || [],
      })
    }

    return NextResponse.json({
      success: true,
      results: calls || [],
    })
  } catch (error: any) {
    console.error('Transcript search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search transcripts' },
      { status: 500 }
    )
  }
}

