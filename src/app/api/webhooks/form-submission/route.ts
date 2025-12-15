import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createLeadAndCall } from '@/lib/leads/auto-create-and-call'

export const dynamic = 'force-dynamic'

/**
 * Webhook endpoint for receiving form submissions from Facebook/Google Ads
 * 
 * Expected payload format:
 * {
 *   organizationId: string (or passed via query param/header)
 *   name: string
 *   phone: string
 *   email?: string
 *   address?: string
 *   city?: string
 *   state?: string
 *   zipCode?: string
 *   serviceType?: string
 *   message?: string
 *   propertyType?: 'residential' | 'commercial' | 'unknown'
 *   budget?: string
 *   timeline?: string
 *   source?: 'facebook' | 'google'
 *   metadata?: Record<string, any>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient()
    
    // Get organization ID from query param, header, or body
    const searchParams = request.nextUrl.searchParams
    const orgIdFromQuery = searchParams.get('orgId')
    const orgIdFromHeader = request.headers.get('X-Organization-Id')
    
    const body = await request.json()
    
    // Verify webhook secret if provided
    const webhookSecret = request.headers.get('X-Webhook-Secret')
    const expectedSecret = process.env.FORM_WEBHOOK_SECRET
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    // Determine organization ID
    const organizationId = orgIdFromQuery || orgIdFromHeader || body.organizationId
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Get auto-call settings from organization config or use defaults
    // For now, default to auto-call enabled
    const autoCall = body.autoCall !== false // Default to true unless explicitly false

    // Get phone number ID for outbound calls (optional)
    const { data: phoneNumbers } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .limit(1)
    
    const phoneNumberId = phoneNumbers?.[0]?.id || undefined

    // Create lead and optionally trigger call
    const result = await createLeadAndCall(
      {
        organizationId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        serviceType: body.serviceType,
        message: body.message || body.description || body.comments,
        propertyType: body.propertyType,
        budget: body.budget,
        timeline: body.timeline,
        source: body.source || 'form',
        metadata: body.metadata || {},
      },
      {
        autoCall,
        phoneNumberId,
      }
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      callId: result.callId,
      message: autoCall && result.callId 
        ? 'Lead created and call initiated'
        : 'Lead created successfully',
    })
  } catch (error: any) {
    console.error('Error processing form submission:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    message: 'Form submission webhook is active',
    timestamp: new Date().toISOString(),
  })
}

