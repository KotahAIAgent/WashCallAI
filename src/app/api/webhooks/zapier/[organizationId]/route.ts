import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Webhook endpoint for receiving data from Zapier
 * 
 * Zapier can send invoices, estimates, and services from connected CRMs
 * 
 * Endpoint: POST /api/webhooks/zapier/[organizationId]
 * 
 * Expected payload formats:
 * 
 * Invoice:
 * {
 *   type: 'invoice',
 *   invoice_number: string,
 *   customer_name: string,
 *   customer_phone?: string,
 *   customer_email?: string,
 *   amount: number,
 *   currency?: string,
 *   issue_date: string (ISO date),
 *   due_date?: string (ISO date),
 *   status: 'pending' | 'paid' | 'overdue' | 'cancelled',
 *   paid_date?: string (ISO date),
 *   description?: string,
 *   metadata?: Record<string, any>
 * }
 * 
 * Estimate:
 * {
 *   type: 'estimate',
 *   estimate_number: string,
 *   customer_name: string,
 *   customer_phone?: string,
 *   customer_email?: string,
 *   amount?: number,
 *   currency?: string,
 *   issue_date: string (ISO date),
 *   expiry_date?: string (ISO date),
 *   status: 'pending' | 'accepted' | 'declined' | 'expired',
 *   service_type?: string,
 *   service_description?: string,
 *   property_address?: string,
 *   property_type?: string,
 *   notes?: string,
 *   metadata?: Record<string, any>
 * }
 * 
 * Service:
 * {
 *   type: 'service',
 *   service_number?: string,
 *   customer_name: string,
 *   customer_phone?: string,
 *   customer_email?: string,
 *   service_type: string,
 *   service_date: string (ISO date),
 *   amount?: number,
 *   property_address?: string,
 *   property_type?: string,
 *   description?: string,
 *   metadata?: Record<string, any>
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params
    const supabase = createServiceRoleClient()
    
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

    const body = await request.json()
    const { type } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Missing type field. Must be "invoice", "estimate", or "service"' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'invoice':
        result = await handleInvoice(supabase, organizationId, body)
        break
      case 'estimate':
        result = await handleEstimate(supabase, organizationId, body)
        break
      case 'service':
        result = await handleService(supabase, organizationId, body)
        break
      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}. Must be "invoice", "estimate", or "service"` },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${type} processed successfully`,
      id: result.id,
    })
  } catch (error: any) {
    console.error('Error processing Zapier webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleInvoice(
  supabase: any,
  organizationId: string,
  data: any
): Promise<{ id?: string; error?: string }> {
  try {
    if (!data.invoice_number || !data.customer_name) {
      return { error: 'invoice_number and customer_name are required' }
    }

    // Check if invoice already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('organization_id', organizationId)
      .or(`invoice_number.eq.${data.invoice_number},crm_invoice_id.eq.${data.crm_invoice_id || ''}`)
      .single()

    const invoiceData = {
      organization_id: organizationId,
      invoice_number: data.invoice_number,
      crm_invoice_id: data.crm_invoice_id || data.id || null,
      customer_name: data.customer_name,
      customer_phone: normalizePhone(data.customer_phone) || null,
      customer_email: data.customer_email || null,
      amount: parseFloat(data.amount) || 0,
      currency: data.currency || 'USD',
      issue_date: data.issue_date ? new Date(data.issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      due_date: data.due_date ? new Date(data.due_date).toISOString().split('T')[0] : null,
      status: mapInvoiceStatus(data.status || 'pending'),
      paid_date: data.paid_date ? new Date(data.paid_date).toISOString().split('T')[0] : null,
      description: data.description || null,
      metadata: data.metadata || { source: 'zapier', ...data },
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        return { error: updateError.message }
      }
      return { id: updated.id }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single()

      if (insertError) {
        return { error: insertError.message }
      }
      return { id: inserted.id }
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

async function handleEstimate(
  supabase: any,
  organizationId: string,
  data: any
): Promise<{ id?: string; error?: string }> {
  try {
    if (!data.estimate_number || !data.customer_name) {
      return { error: 'estimate_number and customer_name are required' }
    }

    // Check if estimate already exists
    const { data: existing } = await supabase
      .from('estimates')
      .select('id')
      .eq('organization_id', organizationId)
      .or(`estimate_number.eq.${data.estimate_number},crm_estimate_id.eq.${data.crm_estimate_id || ''}`)
      .single()

    const estimateData = {
      organization_id: organizationId,
      estimate_number: data.estimate_number,
      crm_estimate_id: data.crm_estimate_id || data.id || null,
      customer_name: data.customer_name,
      customer_phone: normalizePhone(data.customer_phone) || null,
      customer_email: data.customer_email || null,
      amount: data.amount ? parseFloat(data.amount) : null,
      currency: data.currency || 'USD',
      issue_date: data.issue_date ? new Date(data.issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiry_date: data.expiry_date ? new Date(data.expiry_date).toISOString().split('T')[0] : null,
      status: mapEstimateStatus(data.status || 'pending'),
      accepted_date: data.accepted_date ? new Date(data.accepted_date).toISOString().split('T')[0] : null,
      service_type: data.service_type || null,
      service_description: data.service_description || data.description || null,
      property_address: data.property_address || null,
      property_type: data.property_type || null,
      notes: data.notes || null,
      metadata: data.metadata || { source: 'zapier', ...data },
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('estimates')
        .update(estimateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        return { error: updateError.message }
      }
      return { id: updated.id }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('estimates')
        .insert(estimateData)
        .select()
        .single()

      if (insertError) {
        return { error: insertError.message }
      }
      return { id: inserted.id }
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

async function handleService(
  supabase: any,
  organizationId: string,
  data: any
): Promise<{ id?: string; error?: string }> {
  try {
    if (!data.customer_name || !data.service_type || !data.service_date) {
      return { error: 'customer_name, service_type, and service_date are required' }
    }

    // Check if service already exists (by CRM ID if provided)
    let existing = null
    if (data.crm_service_id || data.id) {
      const { data: existingService } = await supabase
        .from('past_services')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('crm_service_id', data.crm_service_id || data.id)
        .single()
      existing = existingService
    }

    const serviceData = {
      organization_id: organizationId,
      service_number: data.service_number || null,
      crm_service_id: data.crm_service_id || data.id || null,
      customer_name: data.customer_name,
      customer_phone: normalizePhone(data.customer_phone) || null,
      customer_email: data.customer_email || null,
      service_type: data.service_type,
      service_date: data.service_date ? new Date(data.service_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      amount: data.amount ? parseFloat(data.amount) : null,
      property_address: data.property_address || null,
      property_type: data.property_type || null,
      description: data.description || null,
      metadata: data.metadata || { source: 'zapier', ...data },
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('past_services')
        .update(serviceData)
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        return { error: updateError.message }
      }
      return { id: updated.id }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('past_services')
        .insert(serviceData)
        .select()
        .single()

      if (insertError) {
        return { error: insertError.message }
      }
      return { id: inserted.id }
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  if (phone.startsWith('+')) {
    return phone
  }
  return phone
}

function mapInvoiceStatus(status: string): 'pending' | 'paid' | 'overdue' | 'cancelled' {
  const lower = status?.toLowerCase() || ''
  if (lower.includes('paid') || lower === 'complete') return 'paid'
  if (lower.includes('overdue') || lower.includes('past due')) return 'overdue'
  if (lower.includes('cancel')) return 'cancelled'
  return 'pending'
}

function mapEstimateStatus(status: string): 'pending' | 'accepted' | 'declined' | 'expired' {
  const lower = status?.toLowerCase() || ''
  if (lower.includes('accept')) return 'accepted'
  if (lower.includes('decline') || lower.includes('reject')) return 'declined'
  if (lower.includes('expir')) return 'expired'
  return 'pending'
}

// Health check endpoint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  const { organizationId } = await params
  return NextResponse.json({
    message: 'Zapier webhook is active',
    organizationId,
    timestamp: new Date().toISOString(),
  })
}

