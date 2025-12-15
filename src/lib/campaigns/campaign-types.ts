'use server'

import { createActionClient } from '@/lib/supabase/server'
import { syncAllCrmIntegrations } from '@/lib/crm/sync-service'

export type CampaignType = 
  | 'company_list' 
  | 'past_customers' 
  | 'missing_invoices' 
  | 'estimate_followup' 
  | 'form_leads'

export interface CampaignTypeConfig {
  company_list: {
    companies: Array<{
      name: string
      phone: string
      email?: string
      address?: string
      city?: string
      state?: string
      notes?: string
    }>
  }
  past_customers: {
    dateRange?: {
      start: Date
      end: Date
    }
    serviceTypes?: string[]
    discountPercentage?: number
    discountMessage?: string
  }
  missing_invoices: {
    daysOverdue?: number
    minAmount?: number
  }
  estimate_followup: {
    status?: 'pending' | 'all'
    daysSinceIssue?: number
  }
  form_leads: {
    source?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
  }
}

/**
 * Builds a campaign from a company list
 */
export async function buildCompanyListCampaign(
  organizationId: string,
  companies: CampaignTypeConfig['company_list']['companies']
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const supabase = createActionClient()

  try {
    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: organizationId,
        name: `Company List Campaign - ${new Date().toLocaleDateString()}`,
        campaign_type: 'company_list',
        status: 'draft',
        campaign_config: {
          totalCompanies: companies.length,
        },
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      return { success: false, error: campaignError?.message || 'Failed to create campaign' }
    }

    // Add companies as contacts
    const contacts = companies.map(company => ({
      campaign_id: campaign.id,
      organization_id: organizationId,
      name: company.name,
      phone: company.phone,
      email: company.email || null,
      address: company.address || null,
      city: company.city || null,
      state: company.state || null,
      business_name: company.name,
      notes: company.notes || null,
      status: 'pending',
      context_data: {
        source: 'company_list',
      },
    }))

    const { error: contactsError } = await supabase
      .from('campaign_contacts')
      .insert(contacts)

    if (contactsError) {
      return { success: false, error: contactsError.message }
    }

    // Update campaign stats
    await supabase
      .from('campaigns')
      .update({ total_contacts: companies.length })
      .eq('id', campaign.id)

    return { success: true, campaignId: campaign.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Builds a campaign from past customers
 */
export async function buildPastCustomerCampaign(
  organizationId: string,
  config: CampaignTypeConfig['past_customers']
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const supabase = createActionClient()

  try {
    // Sync CRM data first to ensure we have latest customer data
    await syncAllCrmIntegrations(organizationId)

    // Build query for past services
    let query = supabase
      .from('past_services')
      .select('*')
      .eq('organization_id', organizationId)

    if (config.dateRange) {
      query = query
        .gte('service_date', config.dateRange.start.toISOString().split('T')[0])
        .lte('service_date', config.dateRange.end.toISOString().split('T')[0])
    }

    if (config.serviceTypes && config.serviceTypes.length > 0) {
      query = query.in('service_type', config.serviceTypes)
    }

    const { data: services, error: servicesError } = await query

    if (servicesError) {
      return { success: false, error: servicesError.message }
    }

    if (!services || services.length === 0) {
      return { success: false, error: 'No past customers found matching criteria' }
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: organizationId,
        name: `Past Customers Campaign - ${new Date().toLocaleDateString()}`,
        campaign_type: 'past_customers',
        status: 'draft',
        campaign_config: {
          discountPercentage: config.discountPercentage,
          discountMessage: config.discountMessage || `Special ${config.discountPercentage || 10}% discount for returning customers!`,
          totalCustomers: services.length,
        },
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      return { success: false, error: campaignError?.message || 'Failed to create campaign' }
    }

    // Group by customer phone to avoid duplicates
    const customerMap = new Map<string, typeof services[0]>()
    for (const service of services) {
      if (service.customer_phone) {
        const normalizedPhone = normalizePhone(service.customer_phone)
        if (!customerMap.has(normalizedPhone)) {
          customerMap.set(normalizedPhone, service)
        }
      }
    }

    // Add customers as contacts
    const contacts = Array.from(customerMap.values()).map(service => ({
      campaign_id: campaign.id,
      organization_id: organizationId,
      name: service.customer_name,
      phone: service.customer_phone || null,
      email: service.customer_email || null,
      address: service.property_address || null,
      business_name: service.customer_name,
      past_service_id: service.id,
      status: 'pending',
      context_data: {
        source: 'past_customers',
        lastServiceType: service.service_type,
        lastServiceDate: service.service_date,
        lastServiceAmount: service.amount,
        discountPercentage: config.discountPercentage,
        discountMessage: config.discountMessage,
      },
    }))

    const { error: contactsError } = await supabase
      .from('campaign_contacts')
      .insert(contacts)

    if (contactsError) {
      return { success: false, error: contactsError.message }
    }

    // Update campaign stats
    await supabase
      .from('campaigns')
      .update({ total_contacts: contacts.length })
      .eq('id', campaign.id)

    return { success: true, campaignId: campaign.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Builds a campaign from missing/overdue invoices
 */
export async function buildMissingInvoiceCampaign(
  organizationId: string,
  config: CampaignTypeConfig['missing_invoices']
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const supabase = createActionClient()

  try {
    // Sync CRM data first
    await syncAllCrmIntegrations(organizationId)

    // Build query for overdue invoices
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .not('due_date', 'is', null)

    if (config.daysOverdue) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - config.daysOverdue)
      query = query.lte('due_date', cutoffDate.toISOString().split('T')[0])
    }

    if (config.minAmount) {
      query = query.gte('amount', config.minAmount)
    }

    const { data: invoices, error: invoicesError } = await query

    if (invoicesError) {
      return { success: false, error: invoicesError.message }
    }

    if (!invoices || invoices.length === 0) {
      return { success: false, error: 'No overdue invoices found matching criteria' }
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: organizationId,
        name: `Missing Invoices Campaign - ${new Date().toLocaleDateString()}`,
        campaign_type: 'missing_invoices',
        status: 'draft',
        campaign_config: {
          totalInvoices: invoices.length,
        },
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      return { success: false, error: campaignError?.message || 'Failed to create campaign' }
    }

    // Add invoices as contacts
    const contacts = invoices
      .filter(inv => inv.customer_phone) // Only include invoices with phone numbers
      .map(invoice => ({
        campaign_id: campaign.id,
        organization_id: organizationId,
        name: invoice.customer_name || 'Customer',
        phone: invoice.customer_phone,
        email: invoice.customer_email || null,
        invoice_id: invoice.id,
        status: 'pending',
        context_data: {
          source: 'missing_invoices',
          invoiceNumber: invoice.invoice_number,
          invoiceAmount: invoice.amount,
          invoiceDueDate: invoice.due_date,
          daysOverdue: invoice.due_date ? 
            Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        },
      }))

    const { error: contactsError } = await supabase
      .from('campaign_contacts')
      .insert(contacts)

    if (contactsError) {
      return { success: false, error: contactsError.message }
    }

    // Update campaign stats
    await supabase
      .from('campaigns')
      .update({ total_contacts: contacts.length })
      .eq('id', campaign.id)

    return { success: true, campaignId: campaign.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Builds a campaign from pending estimates
 */
export async function buildEstimateFollowupCampaign(
  organizationId: string,
  config: CampaignTypeConfig['estimate_followup']
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const supabase = createActionClient()

  try {
    // Sync CRM data first
    await syncAllCrmIntegrations(organizationId)

    // Build query for estimates
    let query = supabase
      .from('estimates')
      .select('*')
      .eq('organization_id', organizationId)

    if (config.status) {
      query = query.eq('status', config.status)
    }

    if (config.daysSinceIssue) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - config.daysSinceIssue)
      query = query.lte('issue_date', cutoffDate.toISOString().split('T')[0])
    }

    const { data: estimates, error: estimatesError } = await query

    if (estimatesError) {
      return { success: false, error: estimatesError.message }
    }

    if (!estimates || estimates.length === 0) {
      return { success: false, error: 'No estimates found matching criteria' }
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: organizationId,
        name: `Estimate Follow-up Campaign - ${new Date().toLocaleDateString()}`,
        campaign_type: 'estimate_followup',
        status: 'draft',
        campaign_config: {
          totalEstimates: estimates.length,
        },
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      return { success: false, error: campaignError?.message || 'Failed to create campaign' }
    }

    // Add estimates as contacts
    const contacts = estimates
      .filter(est => est.customer_phone) // Only include estimates with phone numbers
      .map(estimate => ({
        campaign_id: campaign.id,
        organization_id: organizationId,
        name: estimate.customer_name || 'Customer',
        phone: estimate.customer_phone,
        email: estimate.customer_email || null,
        address: estimate.property_address || null,
        estimate_id: estimate.id,
        status: 'pending',
        context_data: {
          source: 'estimate_followup',
          estimateNumber: estimate.estimate_number,
          estimateAmount: estimate.amount,
          estimateIssueDate: estimate.issue_date,
          serviceType: estimate.service_type,
          serviceDescription: estimate.service_description,
          propertyAddress: estimate.property_address,
          propertyType: estimate.property_type,
        },
      }))

    const { error: contactsError } = await supabase
      .from('campaign_contacts')
      .insert(contacts)

    if (contactsError) {
      return { success: false, error: contactsError.message }
    }

    // Update campaign stats
    await supabase
      .from('campaigns')
      .update({ total_contacts: contacts.length })
      .eq('id', campaign.id)

    return { success: true, campaignId: campaign.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Builds a campaign from form submissions
 */
export async function buildFormLeadCampaign(
  organizationId: string,
  config: CampaignTypeConfig['form_leads']
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  const supabase = createActionClient()

  try {
    // Build query for leads
    let query = supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['new', 'interested'])

    if (config.source && config.source.length > 0) {
      // Note: We'll need to add a source field to leads table or check notes
      // For now, we'll filter by checking notes field
    }

    if (config.dateRange) {
      query = query
        .gte('created_at', config.dateRange.start.toISOString())
        .lte('created_at', config.dateRange.end.toISOString())
    }

    const { data: leads, error: leadsError } = await query

    if (leadsError) {
      return { success: false, error: leadsError.message }
    }

    if (!leads || leads.length === 0) {
      return { success: false, error: 'No form leads found matching criteria' }
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        organization_id: organizationId,
        name: `Form Leads Campaign - ${new Date().toLocaleDateString()}`,
        campaign_type: 'form_leads',
        status: 'draft',
        campaign_config: {
          totalLeads: leads.length,
        },
      })
      .select()
      .single()

    if (campaignError || !campaign) {
      return { success: false, error: campaignError?.message || 'Failed to create campaign' }
    }

    // Add leads as contacts
    const contacts = leads
      .filter(lead => lead.phone) // Only include leads with phone numbers
      .map(lead => ({
        campaign_id: campaign.id,
        organization_id: organizationId,
        name: lead.name || 'Lead',
        phone: lead.phone,
        email: lead.email || null,
        address: lead.address || null,
        city: lead.city || null,
        state: lead.state || null,
        status: 'pending',
        context_data: {
          source: 'form_leads',
          serviceType: lead.service_type,
          propertyType: lead.property_type,
          notes: lead.notes,
        },
      }))

    const { error: contactsError } = await supabase
      .from('campaign_contacts')
      .insert(contacts)

    if (contactsError) {
      return { success: false, error: contactsError.message }
    }

    // Update campaign stats
    await supabase
      .from('campaigns')
      .update({ total_contacts: contacts.length })
      .eq('id', campaign.id)

    return { success: true, campaignId: campaign.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
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

