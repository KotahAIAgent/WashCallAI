import { BaseCrmConnector, CrmConnectionConfig } from './base-connector'
import { CustomCrmConnector } from './custom-connector'
import { MarkateConnector } from './markate-connector'

/**
 * Factory for creating CRM connectors based on CRM type
 */
export function createCrmConnector(
  crmType: string,
  config: CrmConnectionConfig
): BaseCrmConnector {
  switch (crmType.toLowerCase()) {
    case 'markate':
      return new MarkateConnector(config)
    
    // Add other specific CRM connectors here as needed
    // case 'salesforce':
    //   return new SalesforceConnector(config)
    // case 'hubspot':
    //   return new HubSpotConnector(config)
    
    case 'custom':
    default:
      return new CustomCrmConnector(config)
  }
}

