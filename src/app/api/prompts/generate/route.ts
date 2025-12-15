import { NextRequest, NextResponse } from 'next/server'
import { createActionClient } from '@/lib/supabase/server'
import { generatePrompt, OrganizationData } from '@/lib/prompts/generate-prompt'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createActionClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, templateId, type, customData } = body

    if (!organizationId || !type) {
      return NextResponse.json(
        { error: 'organizationId and type are required' },
        { status: 400 }
      )
    }

    // Get organization data
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

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

    // Prepare organization data
    const orgData: OrganizationData = {
      name: organization.name,
      industry: organization.industry || 'general',
      description: organization.description || undefined,
      services_offered: organization.services_offered || undefined,
      service_areas: organization.service_areas || undefined,
      business_hours: organization.business_hours || undefined,
      website: organization.website || undefined,
      city: organization.city || undefined,
      state: organization.state || undefined,
    }

    // Generate prompt
    const result = await generatePrompt(orgData, {
      organizationId,
      templateId,
      type: type || 'inbound',
      customData,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error generating prompt:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate prompt' },
      { status: 500 }
    )
  }
}

