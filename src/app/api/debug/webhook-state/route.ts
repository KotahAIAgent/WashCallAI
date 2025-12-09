import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()
    
    // Get all organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .order('created_at', { ascending: false })
    
    // Get all agent configs
    const { data: agentConfigs } = await supabase
      .from('agent_configs')
      .select('organization_id, inbound_agent_id, outbound_agent_id')
    
    // Get all phone numbers
    const { data: phoneNumbers } = await supabase
      .from('phone_numbers')
      .select('organization_id, phone_number, provider_phone_id, type')
    
    return NextResponse.json({
      organizations: orgs || [],
      agentConfigs: agentConfigs || [],
      phoneNumbers: phoneNumbers || [],
      summary: {
        totalOrganizations: orgs?.length || 0,
        totalAgentConfigs: agentConfigs?.length || 0,
        totalPhoneNumbers: phoneNumbers?.length || 0,
        organizationsWithInboundAgent: agentConfigs?.filter(ac => ac.inbound_agent_id).length || 0,
        organizationsWithOutboundAgent: agentConfigs?.filter(ac => ac.outbound_agent_id).length || 0,
        organizationsWithPhoneNumbers: phoneNumbers?.length || 0,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

