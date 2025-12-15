import { BaseCrmConnector, CrmInvoice, CrmEstimate, CrmCustomer, CrmPastService, CrmConnectionConfig } from './base-connector'
import { CustomCrmConnector } from './custom-connector'

/**
 * Markate CRM connector
 * Uses the custom connector pattern with Markate-specific configuration
 * If Markate has a specific API format, this can be customized
 */
export class MarkateConnector extends CustomCrmConnector {
  constructor(config: CrmConnectionConfig) {
    // Set Markate-specific defaults
    const markateConfig = {
      ...config,
      config: {
        ...config.config,
        // Markate API endpoints (adjust based on actual Markate API)
        invoicesEndpoint: config.config?.invoicesEndpoint || '/api/invoices',
        estimatesEndpoint: config.config?.estimatesEndpoint || '/api/estimates',
        customersEndpoint: config.config?.customersEndpoint || '/api/customers',
        servicesEndpoint: config.config?.servicesEndpoint || '/api/services',
        testEndpoint: config.config?.testEndpoint || '/api/health',
        // Markate field mappings (adjust based on actual Markate API structure)
        invoiceMapping: config.config?.invoiceMapping || {
          id: 'id',
          invoiceNumber: 'invoice_number',
          customerName: 'customer.name',
          customerPhone: 'customer.phone',
          customerEmail: 'customer.email',
          amount: 'total',
          issueDate: 'created_at',
          dueDate: 'due_date',
          status: 'status',
        },
        estimateMapping: config.config?.estimateMapping || {
          id: 'id',
          estimateNumber: 'estimate_number',
          customerName: 'customer.name',
          customerPhone: 'customer.phone',
          customerEmail: 'customer.email',
          amount: 'total',
          issueDate: 'created_at',
          expiryDate: 'expires_at',
          status: 'status',
          serviceType: 'service_type',
          serviceDescription: 'description',
          propertyAddress: 'property.address',
          propertyType: 'property.type',
        },
        customerMapping: config.config?.customerMapping || {
          id: 'id',
          name: 'name',
          phone: 'phone',
          email: 'email',
          address: 'address',
          city: 'city',
          state: 'state',
          zipCode: 'zip_code',
        },
        serviceMapping: config.config?.serviceMapping || {
          id: 'id',
          serviceNumber: 'service_number',
          customerName: 'customer.name',
          customerPhone: 'customer.phone',
          customerEmail: 'customer.email',
          serviceType: 'service_type',
          serviceDate: 'service_date',
          amount: 'total',
          propertyAddress: 'property.address',
          propertyType: 'property.type',
          description: 'description',
        },
      },
    }

    super(markateConfig)
  }

  // Override methods if Markate has specific API behaviors
  // For now, we'll use the custom connector implementation
}

