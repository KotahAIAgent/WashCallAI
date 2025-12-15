/**
 * Base connector interface for CRM integrations
 * All CRM connectors should implement this interface
 */

export interface CrmInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  amount: number
  currency?: string
  issueDate: Date
  dueDate?: Date
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  paidDate?: Date
  description?: string
  metadata?: Record<string, any>
}

export interface CrmEstimate {
  id: string
  estimateNumber: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  amount?: number
  currency?: string
  issueDate: Date
  expiryDate?: Date
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  serviceType?: string
  serviceDescription?: string
  propertyAddress?: string
  propertyType?: string
  metadata?: Record<string, any>
}

export interface CrmCustomer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  metadata?: Record<string, any>
}

export interface CrmPastService {
  id: string
  serviceNumber?: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  serviceType: string
  serviceDate: Date
  amount?: number
  propertyAddress?: string
  propertyType?: string
  description?: string
  metadata?: Record<string, any>
}

export interface CrmConnectionConfig {
  apiEndpoint: string
  apiKey?: string
  apiSecret?: string
  authType: 'api_key' | 'oauth2' | 'basic'
  config?: Record<string, any>
}

export abstract class BaseCrmConnector {
  protected config: CrmConnectionConfig

  constructor(config: CrmConnectionConfig) {
    this.config = config
  }

  /**
   * Test the CRM connection
   */
  abstract testConnection(): Promise<{ success: boolean; error?: string }>

  /**
   * Get invoices from CRM
   * @param filters Optional filters (status, date range, etc.)
   */
  abstract getInvoices(filters?: {
    status?: string
    startDate?: Date
    endDate?: Date
  }): Promise<CrmInvoice[]>

  /**
   * Get estimates from CRM
   * @param filters Optional filters (status, date range, etc.)
   */
  abstract getEstimates(filters?: {
    status?: string
    startDate?: Date
    endDate?: Date
  }): Promise<CrmEstimate[]>

  /**
   * Get customers from CRM
   */
  abstract getCustomers(): Promise<CrmCustomer[]>

  /**
   * Get past services from CRM
   * @param filters Optional filters (customer, date range, etc.)
   */
  abstract getPastServices(filters?: {
    customerId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<CrmPastService[]>

  /**
   * Update a lead/customer in CRM (optional)
   */
  async updateLead(leadId: string, data: Partial<CrmCustomer>): Promise<boolean> {
    // Default implementation - override if CRM supports it
    return false
  }

  /**
   * Convert CRM date string to Date object
   */
  protected parseDate(dateString: string | Date | null | undefined): Date | undefined {
    if (!dateString) return undefined
    if (dateString instanceof Date) return dateString
    return new Date(dateString)
  }

  /**
   * Normalize phone number to E.164 format
   */
  protected normalizePhone(phone: string | null | undefined): string | undefined {
    if (!phone) return undefined
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
}

