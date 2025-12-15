'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { createCrmConnector } from './connector-factory'
import type { BaseCrmConnector } from './base-connector'

/**
 * Syncs data from CRM to local database
 */
export async function syncCrmData(crmIntegrationId: string): Promise<{
  success: boolean
  error?: string
  stats?: {
    invoices: number
    estimates: number
    customers: number
    services: number
  }
}> {
  const supabase = createServiceRoleClient()

  try {
    // Get CRM integration config
    const { data: integration, error: intError } = await supabase
      .from('crm_integrations')
      .select('*')
      .eq('id', crmIntegrationId)
      .single()

    if (intError || !integration) {
      return { success: false, error: 'CRM integration not found' }
    }

    if (!integration.active) {
      return { success: false, error: 'CRM integration is not active' }
    }

    // Update sync status
    await supabase
      .from('crm_integrations')
      .update({
        last_sync_status: 'in_progress',
        last_sync_error: null,
      })
      .eq('id', crmIntegrationId)

    // Create connector
    const connector = createCrmConnector(integration.crm_type, {
      apiEndpoint: integration.api_endpoint,
      apiKey: integration.api_key || undefined,
      apiSecret: integration.api_secret || undefined,
      authType: integration.auth_type as any,
      config: integration.config || {},
    })

    // Test connection first
    const testResult = await connector.testConnection()
    if (!testResult.success) {
      await supabase
        .from('crm_integrations')
        .update({
          last_sync_status: 'failed',
          last_sync_error: testResult.error,
        })
        .eq('id', crmIntegrationId)
      
      return { success: false, error: testResult.error }
    }

    const stats = {
      invoices: 0,
      estimates: 0,
      customers: 0,
      services: 0,
    }

    // Sync invoices
    try {
      const invoices = await connector.getInvoices()
      for (const invoice of invoices) {
        await syncInvoice(supabase, integration.organization_id, crmIntegrationId, invoice)
        stats.invoices++
      }
    } catch (error: any) {
      console.error('Error syncing invoices:', error)
    }

    // Sync estimates
    try {
      const estimates = await connector.getEstimates()
      for (const estimate of estimates) {
        await syncEstimate(supabase, integration.organization_id, crmIntegrationId, estimate)
        stats.estimates++
      }
    } catch (error: any) {
      console.error('Error syncing estimates:', error)
    }

    // Sync past services
    try {
      const services = await connector.getPastServices()
      for (const service of services) {
        await syncPastService(supabase, integration.organization_id, crmIntegrationId, service)
        stats.services++
      }
    } catch (error: any) {
      console.error('Error syncing past services:', error)
    }

    // Update sync status to success
    await supabase
      .from('crm_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_sync_error: null,
      })
      .eq('id', crmIntegrationId)

    return { success: true, stats }
  } catch (error: any) {
    console.error('Error syncing CRM data:', error)
    
    await supabase
      .from('crm_integrations')
      .update({
        last_sync_status: 'failed',
        last_sync_error: error.message,
      })
      .eq('id', crmIntegrationId)

    return { success: false, error: error.message }
  }
}

async function syncInvoice(
  supabase: any,
  organizationId: string,
  crmIntegrationId: string,
  invoice: any
) {
  // Try to find existing invoice by CRM ID or invoice number
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('organization_id', organizationId)
    .or(`crm_invoice_id.eq.${invoice.id},invoice_number.eq.${invoice.invoiceNumber}`)
    .single()

  const invoiceData = {
    organization_id: organizationId,
    crm_integration_id: crmIntegrationId,
    invoice_number: invoice.invoiceNumber,
    crm_invoice_id: invoice.id,
    customer_name: invoice.customerName,
    customer_phone: invoice.customerPhone || null,
    customer_email: invoice.customerEmail || null,
    amount: invoice.amount,
    currency: invoice.currency || 'USD',
    issue_date: invoice.issueDate.toISOString().split('T')[0],
    due_date: invoice.dueDate?.toISOString().split('T')[0] || null,
    status: invoice.status,
    paid_date: invoice.paidDate?.toISOString().split('T')[0] || null,
    description: invoice.description || null,
    metadata: invoice.metadata || {},
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', existing.id)
  } else {
    await supabase
      .from('invoices')
      .insert(invoiceData)
  }
}

async function syncEstimate(
  supabase: any,
  organizationId: string,
  crmIntegrationId: string,
  estimate: any
) {
  const { data: existing } = await supabase
    .from('estimates')
    .select('id')
    .eq('organization_id', organizationId)
    .or(`crm_estimate_id.eq.${estimate.id},estimate_number.eq.${estimate.estimateNumber}`)
    .single()

  const estimateData = {
    organization_id: organizationId,
    crm_integration_id: crmIntegrationId,
    estimate_number: estimate.estimateNumber,
    crm_estimate_id: estimate.id,
    customer_name: estimate.customerName,
    customer_phone: estimate.customerPhone || null,
    customer_email: estimate.customerEmail || null,
    amount: estimate.amount || null,
    currency: estimate.currency || 'USD',
    issue_date: estimate.issueDate.toISOString().split('T')[0],
    expiry_date: estimate.expiryDate?.toISOString().split('T')[0] || null,
    status: estimate.status,
    accepted_date: estimate.acceptedDate?.toISOString().split('T')[0] || null,
    service_type: estimate.serviceType || null,
    service_description: estimate.serviceDescription || null,
    property_address: estimate.propertyAddress || null,
    property_type: estimate.propertyType || null,
    notes: estimate.description || null,
    metadata: estimate.metadata || {},
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    await supabase
      .from('estimates')
      .update(estimateData)
      .eq('id', existing.id)
  } else {
    await supabase
      .from('estimates')
      .insert(estimateData)
  }
}

async function syncPastService(
  supabase: any,
  organizationId: string,
  crmIntegrationId: string,
  service: any
) {
  const { data: existing } = await supabase
    .from('past_services')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('crm_service_id', service.id)
    .single()

  const serviceData = {
    organization_id: organizationId,
    crm_integration_id: crmIntegrationId,
    service_number: service.serviceNumber || null,
    crm_service_id: service.id,
    customer_name: service.customerName,
    customer_phone: service.customerPhone || null,
    customer_email: service.customerEmail || null,
    service_type: service.serviceType,
    service_date: service.serviceDate.toISOString().split('T')[0],
    amount: service.amount || null,
    property_address: service.propertyAddress || null,
    property_type: service.propertyType || null,
    description: service.description || null,
    metadata: service.metadata || {},
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    await supabase
      .from('past_services')
      .update(serviceData)
      .eq('id', existing.id)
  } else {
    await supabase
      .from('past_services')
      .insert(serviceData)
  }
}

/**
 * Sync all active CRM integrations for an organization
 */
export async function syncAllCrmIntegrations(organizationId: string): Promise<void> {
  const supabase = createServiceRoleClient()

  const { data: integrations } = await supabase
    .from('crm_integrations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .eq('sync_enabled', true)

  if (!integrations) return

  for (const integration of integrations) {
    await syncCrmData(integration.id)
  }
}

