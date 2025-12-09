import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .single() as { data: { organization_id: string } | null }

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  const organizationId = profile.organization_id
  const searchTerm = `%${query}%`

  // Search in parallel
  const [leads, calls, campaigns, transcripts] = await Promise.all([
    // Search leads
    supabase
      .from('leads')
      .select('id, name, phone, email, status')
      .eq('organization_id', organizationId)
      .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5),
    
    // Search calls (by phone number and transcript)
    supabase
      .from('calls')
      .select('id, from_number, to_number, direction, status, created_at, transcript, summary')
      .eq('organization_id', organizationId)
      .or(`from_number.ilike.${searchTerm},to_number.ilike.${searchTerm},transcript.ilike.${searchTerm},summary.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Search campaigns
    supabase
      .from('campaigns')
      .select('id, name, description, status')
      .eq('organization_id', organizationId)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5),
    
    // Search call transcripts separately for better highlighting
    supabase
      .from('calls')
      .select('id, transcript, summary, from_number, to_number, created_at')
      .eq('organization_id', organizationId)
      .or(`transcript.ilike.${searchTerm},summary.ilike.${searchTerm}`)
      .not('transcript', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  // Format results
  const results = [
    ...(leads.data || []).map(lead => ({
      type: 'lead' as const,
      id: lead.id,
      title: lead.name || 'Unknown Lead',
      subtitle: lead.phone || lead.email || 'No contact info',
      href: `/app/leads/${lead.id}`,
    })),
    ...(calls.data || []).map(call => {
      const hasTranscriptMatch = call.transcript?.toLowerCase().includes(query.toLowerCase()) || 
                                 call.summary?.toLowerCase().includes(query.toLowerCase())
      const transcriptSnippet = hasTranscriptMatch && call.transcript
        ? call.transcript.substring(0, 100) + '...'
        : call.summary || call.from_number || call.to_number || 'Unknown number'
      
      return {
        type: 'call' as const,
        id: call.id,
        title: `${call.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call`,
        subtitle: transcriptSnippet,
        href: `/app/calls?id=${call.id}`,
        highlight: hasTranscriptMatch,
      }
    }),
    ...(campaigns.data || []).map(campaign => ({
      type: 'campaign' as const,
      id: campaign.id,
      title: campaign.name,
      subtitle: campaign.description || `Status: ${campaign.status}`,
      href: `/app/campaigns/${campaign.id}`,
    })),
  ]

  // Add transcript-specific results
  if (transcripts.data && transcripts.data.length > 0) {
    transcripts.data.forEach(call => {
      if (!results.find(r => r.type === 'call' && r.id === call.id)) {
        const transcriptSnippet = call.transcript
          ? call.transcript.substring(0, 150) + '...'
          : call.summary || 'Call transcript'
        
        results.push({
          type: 'call' as const,
          id: call.id,
          title: 'Call Transcript Match',
          subtitle: transcriptSnippet,
          href: `/app/calls?id=${call.id}`,
          highlight: true,
        })
      }
    })
  }

  return NextResponse.json({ results })
}

