'use server'

import { createActionClient } from '@/lib/supabase/server'

export async function exportLeadsToCSV(organizationId: string, filters?: {
  status?: string
  dateFrom?: string
  dateTo?: string
  tags?: string[]
}) {
  const supabase = createActionClient()

  let query = supabase
    .from('leads')
    .select(`
      *,
      lead_tags (
        tags (name)
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data: leads, error } = await query

  if (error) {
    return { error: error.message }
  }

  // Transform to CSV format
  const headers = [
    'Name', 'Phone', 'Email', 'Address', 'City', 'State', 'Zip',
    'Property Type', 'Service Type', 'Status', 'Score', 'Tags',
    'Source', 'Notes', 'Created At'
  ]

  const rows = leads?.map(lead => {
    const tags = (lead.lead_tags as any[])?.map(lt => lt.tags?.name).filter(Boolean).join(', ') || ''
    return [
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.address || '',
      lead.city || '',
      lead.state || '',
      lead.zip_code || '',
      lead.property_type || '',
      lead.service_type || '',
      lead.status || '',
      lead.score?.toString() || '0',
      tags,
      lead.source || '',
      (lead.notes || '').replace(/"/g, '""'),
      new Date(lead.created_at).toLocaleDateString(),
    ]
  }) || []

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return { csv: csvContent, filename: `leads-${new Date().toISOString().split('T')[0]}.csv` }
}

export async function exportCallsToCSV(organizationId: string, filters?: {
  direction?: string
  dateFrom?: string
  dateTo?: string
}) {
  const supabase = createActionClient()

  let query = supabase
    .from('calls')
    .select(`
      *,
      leads (name, phone)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (filters?.direction && filters.direction !== 'all') {
    query = query.eq('direction', filters.direction)
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const { data: calls, error } = await query

  if (error) {
    return { error: error.message }
  }

  const headers = [
    'Date', 'Time', 'Direction', 'From', 'To', 'Lead Name',
    'Status', 'Duration (sec)', 'Summary', 'Has Recording'
  ]

  const rows = calls?.map(call => {
    const lead = call.leads as any
    const date = new Date(call.created_at)
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      call.direction,
      call.from_number || '',
      call.to_number || '',
      lead?.name || '',
      call.status,
      call.duration_seconds?.toString() || '',
      (call.summary || '').replace(/"/g, '""').substring(0, 200),
      call.recording_url ? 'Yes' : 'No',
    ]
  }) || []

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return { csv: csvContent, filename: `calls-${new Date().toISOString().split('T')[0]}.csv` }
}

export async function exportCampaignContactsToCSV(organizationId: string, campaignId?: string) {
  const supabase = createActionClient()

  let query = supabase
    .from('campaign_contacts')
    .select(`
      *,
      campaigns (name)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data: contacts, error } = await query

  if (error) {
    return { error: error.message }
  }

  const headers = [
    'Name', 'Phone', 'Email', 'Business Name', 'Address', 'City', 'State',
    'Campaign', 'Status', 'Call Count', 'Last Call', 'Last Outcome', 'Notes'
  ]

  const rows = contacts?.map(contact => {
    const campaign = contact.campaigns as any
    return [
      contact.name || '',
      contact.phone || '',
      contact.email || '',
      contact.business_name || '',
      contact.address || '',
      contact.city || '',
      contact.state || '',
      campaign?.name || '',
      contact.status,
      contact.call_count?.toString() || '0',
      contact.last_call_at ? new Date(contact.last_call_at).toLocaleDateString() : '',
      contact.last_call_summary?.substring(0, 100) || '',
      (contact.notes || '').replace(/"/g, '""'),
    ]
  }) || []

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return { csv: csvContent, filename: `campaign-contacts-${new Date().toISOString().split('T')[0]}.csv` }
}

export async function getAnalyticsReport(organizationId: string, dateFrom: string, dateTo: string) {
  const supabase = createActionClient()

  // Get calls stats
  const { data: calls } = await supabase
    .from('calls')
    .select('direction, status, duration_seconds')
    .eq('organization_id', organizationId)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)

  // Get leads stats
  const { data: leads } = await supabase
    .from('leads')
    .select('status, source, score')
    .eq('organization_id', organizationId)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)

  // Get appointments stats
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('organization_id', organizationId)
    .gte('created_at', dateFrom)
    .lte('created_at', dateTo)

  const totalCalls = calls?.length || 0
  const inboundCalls = calls?.filter(c => c.direction === 'inbound').length || 0
  const outboundCalls = calls?.filter(c => c.direction === 'outbound').length || 0
  const answeredCalls = calls?.filter(c => c.status === 'answered' || c.status === 'completed').length || 0
  const avgDuration = (calls?.filter(c => c.duration_seconds)
    .reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0) / (answeredCalls || 1)

  const totalLeads = leads?.length || 0
  const interestedLeads = leads?.filter(l => l.status === 'interested').length || 0
  const bookedLeads = leads?.filter(l => l.status === 'booked').length || 0
  const avgScore = leads?.reduce((sum, l) => sum + (l.score || 0), 0) / (totalLeads || 1)

  return {
    period: { from: dateFrom, to: dateTo },
    calls: {
      total: totalCalls,
      inbound: inboundCalls,
      outbound: outboundCalls,
      answered: answeredCalls,
      answerRate: totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0,
      avgDuration: Math.round(avgDuration),
    },
    leads: {
      total: totalLeads,
      interested: interestedLeads,
      booked: bookedLeads,
      conversionRate: totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0,
      avgScore: Math.round(avgScore),
    },
    appointments: {
      total: appointments?.length || 0,
    },
  }
}

