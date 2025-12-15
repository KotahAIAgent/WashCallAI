import { BaseCrmConnector, CrmInvoice, CrmEstimate, CrmCustomer, CrmPastService, CrmConnectionConfig } from './base-connector'

/**
 * Generic REST API connector for CRMs that follow standard REST patterns
 * Can be configured for any REST-based CRM
 */
export class CustomCrmConnector extends BaseCrmConnector {
  private baseUrl: string
  private headers: Record<string, string>

  constructor(config: CrmConnectionConfig) {
    super(config)
    this.baseUrl = config.apiEndpoint.replace(/\/$/, '')
    
    // Build headers based on auth type
    this.headers = {
      'Content-Type': 'application/json',
    }

    if (config.authType === 'api_key' && config.apiKey) {
      // Try common API key header patterns
      const apiKeyHeader = config.config?.apiKeyHeader || 'X-API-Key'
      this.headers[apiKeyHeader] = config.apiKey
    } else if (config.authType === 'basic' && config.apiKey) {
      const credentials = Buffer.from(`${config.apiKey}:${config.apiSecret || ''}`).toString('base64')
      this.headers['Authorization'] = `Basic ${credentials}`
    } else if (config.authType === 'oauth2' && config.apiKey) {
      this.headers['Authorization'] = `Bearer ${config.apiKey}`
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to hit a health/status endpoint
      const testEndpoint = this.config.config?.testEndpoint || '/health'
      const response = await fetch(`${this.baseUrl}${testEndpoint}`, {
        method: 'GET',
        headers: this.headers,
      })

      if (response.ok) {
        return { success: true }
      }

      return {
        success: false,
        error: `Connection test failed: ${response.status} ${response.statusText}`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection test failed',
      }
    }
  }

  async getInvoices(filters?: {
    status?: string
    startDate?: Date
    endDate?: Date
  }): Promise<CrmInvoice[]> {
    try {
      const endpoint = this.config.config?.invoicesEndpoint || '/api/invoices'
      const params = new URLSearchParams()

      if (filters?.status) params.append('status', filters.status)
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())

      const url = `${this.baseUrl}${endpoint}${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch invoices: ${response.status}`)
      }

      const data = await response.json()
      
      // Handle different response formats
      const invoices = Array.isArray(data) ? data : (data.invoices || data.data || [])
      
      return invoices.map((inv: any) => this.mapToCrmInvoice(inv))
    } catch (error: any) {
      console.error('Error fetching invoices from custom CRM:', error)
      return []
    }
  }

  async getEstimates(filters?: {
    status?: string
    startDate?: Date
    endDate?: Date
  }): Promise<CrmEstimate[]> {
    try {
      const endpoint = this.config.config?.estimatesEndpoint || '/api/estimates'
      const params = new URLSearchParams()

      if (filters?.status) params.append('status', filters.status)
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())

      const url = `${this.baseUrl}${endpoint}${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch estimates: ${response.status}`)
      }

      const data = await response.json()
      const estimates = Array.isArray(data) ? data : (data.estimates || data.data || [])
      
      return estimates.map((est: any) => this.mapToCrmEstimate(est))
    } catch (error: any) {
      console.error('Error fetching estimates from custom CRM:', error)
      return []
    }
  }

  async getCustomers(): Promise<CrmCustomer[]> {
    try {
      const endpoint = this.config.config?.customersEndpoint || '/api/customers'
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`)
      }

      const data = await response.json()
      const customers = Array.isArray(data) ? data : (data.customers || data.data || [])
      
      return customers.map((cust: any) => this.mapToCrmCustomer(cust))
    } catch (error: any) {
      console.error('Error fetching customers from custom CRM:', error)
      return []
    }
  }

  async getPastServices(filters?: {
    customerId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<CrmPastService[]> {
    try {
      const endpoint = this.config.config?.servicesEndpoint || '/api/services'
      const params = new URLSearchParams()

      if (filters?.customerId) params.append('customerId', filters.customerId)
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString())
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString())

      const url = `${this.baseUrl}${endpoint}${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`)
      }

      const data = await response.json()
      const services = Array.isArray(data) ? data : (data.services || data.data || [])
      
      return services.map((svc: any) => this.mapToCrmPastService(svc))
    } catch (error: any) {
      console.error('Error fetching past services from custom CRM:', error)
      return []
    }
  }

  // Mapping functions - these can be customized via config if needed
  private mapToCrmInvoice(data: any): CrmInvoice {
    const mapping = this.config.config?.invoiceMapping || {}
    
    return {
      id: data[mapping.id || 'id'] || data.id,
      invoiceNumber: data[mapping.invoiceNumber || 'invoiceNumber'] || data.number || data.invoice_number,
      customerName: data[mapping.customerName || 'customerName'] || data.customer?.name || data.customer_name,
      customerPhone: this.normalizePhone(data[mapping.customerPhone || 'customerPhone'] || data.customer?.phone || data.customer_phone),
      customerEmail: data[mapping.customerEmail || 'customerEmail'] || data.customer?.email || data.customer_email,
      amount: parseFloat(data[mapping.amount || 'amount'] || data.total || 0),
      currency: data[mapping.currency || 'currency'] || data.currency || 'USD',
      issueDate: this.parseDate(data[mapping.issueDate || 'issueDate'] || data.date || data.issue_date) || new Date(),
      dueDate: this.parseDate(data[mapping.dueDate || 'dueDate'] || data.due_date),
      status: this.mapInvoiceStatus(data[mapping.status || 'status'] || data.status),
      paidDate: this.parseDate(data[mapping.paidDate || 'paidDate'] || data.paid_date),
      description: data[mapping.description || 'description'] || data.description,
      metadata: data,
    }
  }

  private mapToCrmEstimate(data: any): CrmEstimate {
    const mapping = this.config.config?.estimateMapping || {}
    
    return {
      id: data[mapping.id || 'id'] || data.id,
      estimateNumber: data[mapping.estimateNumber || 'estimateNumber'] || data.number || data.estimate_number,
      customerName: data[mapping.customerName || 'customerName'] || data.customer?.name || data.customer_name,
      customerPhone: this.normalizePhone(data[mapping.customerPhone || 'customerPhone'] || data.customer?.phone || data.customer_phone),
      customerEmail: data[mapping.customerEmail || 'customerEmail'] || data.customer?.email || data.customer_email,
      amount: data[mapping.amount || 'amount'] ? parseFloat(data[mapping.amount || 'amount']) : undefined,
      currency: data[mapping.currency || 'currency'] || data.currency || 'USD',
      issueDate: this.parseDate(data[mapping.issueDate || 'issueDate'] || data.date || data.issue_date) || new Date(),
      expiryDate: this.parseDate(data[mapping.expiryDate || 'expiryDate'] || data.expiry_date || data.expiryDate),
      status: this.mapEstimateStatus(data[mapping.status || 'status'] || data.status),
      serviceType: data[mapping.serviceType || 'serviceType'] || data.service_type,
      serviceDescription: data[mapping.serviceDescription || 'serviceDescription'] || data.service_description || data.description,
      propertyAddress: data[mapping.propertyAddress || 'propertyAddress'] || data.property_address,
      propertyType: data[mapping.propertyType || 'propertyType'] || data.property_type,
      metadata: data,
    }
  }

  private mapToCrmCustomer(data: any): CrmCustomer {
    const mapping = this.config.config?.customerMapping || {}
    
    return {
      id: data[mapping.id || 'id'] || data.id,
      name: data[mapping.name || 'name'] || data.customerName || data.customer_name,
      phone: this.normalizePhone(data[mapping.phone || 'phone'] || data.phoneNumber || data.phone_number),
      email: data[mapping.email || 'email'] || data.emailAddress || data.email_address,
      address: data[mapping.address || 'address'] || data.street || data.street_address,
      city: data[mapping.city || 'city'] || data.city,
      state: data[mapping.state || 'state'] || data.state,
      zipCode: data[mapping.zipCode || 'zipCode'] || data.zip || data.zip_code,
      metadata: data,
    }
  }

  private mapToCrmPastService(data: any): CrmPastService {
    const mapping = this.config.config?.serviceMapping || {}
    
    return {
      id: data[mapping.id || 'id'] || data.id,
      serviceNumber: data[mapping.serviceNumber || 'serviceNumber'] || data.number || data.service_number,
      customerName: data[mapping.customerName || 'customerName'] || data.customer?.name || data.customer_name,
      customerPhone: this.normalizePhone(data[mapping.customerPhone || 'customerPhone'] || data.customer?.phone || data.customer_phone),
      customerEmail: data[mapping.customerEmail || 'customerEmail'] || data.customer?.email || data.customer_email,
      serviceType: data[mapping.serviceType || 'serviceType'] || data.service_type || 'Service',
      serviceDate: this.parseDate(data[mapping.serviceDate || 'serviceDate'] || data.date || data.service_date) || new Date(),
      amount: data[mapping.amount || 'amount'] ? parseFloat(data[mapping.amount || 'amount']) : undefined,
      propertyAddress: data[mapping.propertyAddress || 'propertyAddress'] || data.property_address,
      propertyType: data[mapping.propertyType || 'propertyType'] || data.property_type,
      description: data[mapping.description || 'description'] || data.description,
      metadata: data,
    }
  }

  private mapInvoiceStatus(status: string): 'pending' | 'paid' | 'overdue' | 'cancelled' {
    const lower = status?.toLowerCase() || ''
    if (lower.includes('paid') || lower === 'complete') return 'paid'
    if (lower.includes('overdue') || lower.includes('past due')) return 'overdue'
    if (lower.includes('cancel')) return 'cancelled'
    return 'pending'
  }

  private mapEstimateStatus(status: string): 'pending' | 'accepted' | 'declined' | 'expired' {
    const lower = status?.toLowerCase() || ''
    if (lower.includes('accept')) return 'accepted'
    if (lower.includes('decline') || lower.includes('reject')) return 'declined'
    if (lower.includes('expir')) return 'expired'
    return 'pending'
  }
}

