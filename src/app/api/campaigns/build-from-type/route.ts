import { NextRequest, NextResponse } from 'next/server'
import { createActionClient } from '@/lib/supabase/server'
import {
  buildCompanyListCampaign,
  buildPastCustomerCampaign,
  buildMissingInvoiceCampaign,
  buildEstimateFollowupCampaign,
  buildFormLeadCampaign,
} from '@/lib/campaigns/campaign-types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createActionClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, campaignType, config } = body

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

    let result

    switch (campaignType) {
      case 'company_list':
        result = await buildCompanyListCampaign(organizationId, config.companies || [])
        break

      case 'past_customers':
        result = await buildPastCustomerCampaign(organizationId, config)
        break

      case 'missing_invoices':
        result = await buildMissingInvoiceCampaign(organizationId, config)
        break

      case 'estimate_followup':
        result = await buildEstimateFollowupCampaign(organizationId, config)
        break

      case 'form_leads':
        result = await buildFormLeadCampaign(organizationId, config)
        break

      default:
        return NextResponse.json(
          { error: `Unknown campaign type: ${campaignType}` },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to build campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
    })
  } catch (error: any) {
    console.error('Error building campaign:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to build campaign' },
      { status: 500 }
    )
  }
}

