import { createServiceRoleClient } from '@/lib/supabase/server'

export interface CallContext {
  // Campaign context
  campaignType?: string
  campaignName?: string
  
  // Customer context
  customerName?: string
  isPastCustomer?: boolean
  lastServiceType?: string
  lastServiceDate?: string
  lastServiceAmount?: number
  
  // Invoice context
  hasOverdueInvoice?: boolean
  invoiceNumber?: string
  invoiceAmount?: number
  daysOverdue?: number
  
  // Estimate context
  hasPendingEstimate?: boolean
  estimateNumber?: string
  estimateAmount?: number
  estimateServiceType?: string
  estimateServiceDescription?: string
  estimatePropertyAddress?: string
  estimatePropertyType?: string
  
  // Discount/promotion context
  discountPercentage?: number
  discountMessage?: string
  
  // Form lead context
  isFormLead?: boolean
  formServiceType?: string
  formPropertyType?: string
  formMessage?: string
}

/**
 * Builds context for an outbound call based on lead, campaign, and CRM data
 */
export async function buildCallContext(
  organizationId: string,
  leadId?: string,
  campaignContactId?: string
): Promise<CallContext> {
  const supabase = createServiceRoleClient()
  const context: CallContext = {}

  try {
    // Get campaign contact if provided
    if (campaignContactId) {
      const { data: contact } = await supabase
        .from('campaign_contacts')
        .select(`
          *,
          campaigns(campaign_type, name),
          invoices(id, invoice_number, amount, due_date),
          estimates(id, estimate_number, amount, service_type, service_description, property_address, property_type),
          past_services(id, service_type, service_date, amount)
        `)
        .eq('id', campaignContactId)
        .single()

      if (contact) {
        // Campaign context
        if (contact.campaigns) {
          context.campaignType = (contact.campaigns as any).campaign_type
          context.campaignName = (contact.campaigns as any).name
        }

        // Context data from campaign contact
        const contextData = contact.context_data || {}
        
        // Past customer context
        if (contact.past_service_id) {
          const pastService = contact.past_services as any
          if (pastService) {
            context.isPastCustomer = true
            context.lastServiceType = pastService.service_type
            context.lastServiceDate = pastService.service_date
            context.lastServiceAmount = pastService.amount
          }
        }

        // Invoice context
        if (contact.invoice_id) {
          const invoice = contact.invoices as any
          if (invoice) {
            context.hasOverdueInvoice = true
            context.invoiceNumber = invoice.invoice_number
            context.invoiceAmount = invoice.amount
            if (invoice.due_date) {
              const dueDate = new Date(invoice.due_date)
              const today = new Date()
              context.daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            }
          }
        }

        // Estimate context
        if (contact.estimate_id) {
          const estimate = contact.estimates as any
          if (estimate) {
            context.hasPendingEstimate = true
            context.estimateNumber = estimate.estimate_number
            context.estimateAmount = estimate.amount
            context.estimateServiceType = estimate.service_type
            context.estimateServiceDescription = estimate.service_description
            context.estimatePropertyAddress = estimate.property_address
            context.estimatePropertyType = estimate.property_type
          }
        }

        // Discount context
        if (contextData.discountPercentage) {
          context.discountPercentage = contextData.discountPercentage
          context.discountMessage = contextData.discountMessage
        }

        // Form lead context
        if (contextData.source === 'form_leads') {
          context.isFormLead = true
          context.formServiceType = contextData.serviceType
          context.formPropertyType = contextData.propertyType
          context.formMessage = contextData.notes
        }
      }
    }

    // If we have a lead ID, get additional lead context
    if (leadId) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (lead) {
        context.customerName = lead.name || undefined
        context.formServiceType = lead.service_type || undefined
        context.formPropertyType = lead.property_type || undefined
        
        // Check if this is a past customer by phone
        if (lead.phone) {
          const { data: pastServices } = await supabase
            .from('past_services')
            .select('service_type, service_date, amount')
            .eq('organization_id', organizationId)
            .eq('customer_phone', lead.phone)
            .order('service_date', { ascending: false })
            .limit(1)
            .single()

          if (pastServices) {
            context.isPastCustomer = true
            context.lastServiceType = pastServices.service_type
            context.lastServiceDate = pastServices.service_date
            context.lastServiceAmount = pastServices.amount
          }
        }
      }
    }

    return context
  } catch (error) {
    console.error('Error building call context:', error)
    return context
  }
}

// formatContextForPrompt moved to separate file to avoid server action restrictions

