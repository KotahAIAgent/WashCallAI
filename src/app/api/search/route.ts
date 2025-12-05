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
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  const organizationId = profile.organization_id
  const searchTerm = `%${query}%`

  // Search in parallel
  const [leads, calls, campaigns] = await Promise.all([
    // Search leads
    supabase
      .from('leads')
      .select('id, name, phone, email, status')
      .eq('organization_id', organizationId)
      .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5),
    
    // Search calls (by phone number)
    supabase
      .from('calls')
      .select('id, from_number, to_number, direction, status, created_at')
      .eq('organization_id', organizationId)
      .or(`from_number.ilike.${searchTerm},to_number.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(5),
    
    // Search campaigns
    supabase
      .from('campaigns')
      .select('id, name, description, status')
      .eq('organization_id', organizationId)
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5),
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
    ...(calls.data || []).map(call => ({
      type: 'call' as const,
      id: call.id,
      title: `${call.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call`,
      subtitle: call.from_number || call.to_number || 'Unknown number',
      href: `/app/calls?id=${call.id}`,
    })),
    ...(campaigns.data || []).map(campaign => ({
      type: 'campaign' as const,
      id: campaign.id,
      title: campaign.name,
      subtitle: campaign.description || `Status: ${campaign.status}`,
      href: `/app/campaigns/${campaign.id}`,
    })),
  ]

  return NextResponse.json({ results })
}

