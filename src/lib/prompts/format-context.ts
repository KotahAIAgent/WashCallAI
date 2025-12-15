import type { CallContext } from './context-builder'

/**
 * Formats context into a human-readable string for prompt injection
 * This is a pure function, safe to use in client or server contexts
 */
export function formatContextForPrompt(context: CallContext): string {
  const parts: string[] = []

  if (context.campaignName) {
    parts.push(`Campaign: ${context.campaignName}`)
  }

  if (context.isPastCustomer) {
    parts.push(`This is a RETURNING CUSTOMER.`)
    if (context.lastServiceType) {
      parts.push(`Last service: ${context.lastServiceType}`)
    }
    if (context.lastServiceDate) {
      parts.push(`Last service date: ${context.lastServiceDate}`)
    }
    if (context.discountPercentage) {
      parts.push(`SPECIAL OFFER: ${context.discountMessage || `${context.discountPercentage}% discount for returning customers`}`)
    }
  }

  if (context.hasOverdueInvoice) {
    parts.push(`INVOICE FOLLOW-UP: Invoice #${context.invoiceNumber} for $${context.invoiceAmount?.toFixed(2)}`)
    if (context.daysOverdue && context.daysOverdue > 0) {
      parts.push(`Invoice is ${context.daysOverdue} days overdue`)
    }
    parts.push(`Goal: Collect payment or arrange payment plan`)
  }

  if (context.hasPendingEstimate) {
    parts.push(`ESTIMATE FOLLOW-UP: Estimate #${context.estimateNumber}`)
    if (context.estimateAmount) {
      parts.push(`Amount: $${context.estimateAmount.toFixed(2)}`)
    }
    if (context.estimateServiceType) {
      parts.push(`Service: ${context.estimateServiceType}`)
    }
    if (context.estimateServiceDescription) {
      parts.push(`Details: ${context.estimateServiceDescription}`)
    }
    if (context.estimatePropertyAddress) {
      parts.push(`Property: ${context.estimatePropertyAddress}`)
    }
    parts.push(`Goal: Follow up on estimate, answer questions, schedule service`)
  }

  if (context.isFormLead) {
    parts.push(`This lead came from a form submission`)
    if (context.formServiceType) {
      parts.push(`Interested in: ${context.formServiceType}`)
    }
    if (context.formMessage) {
      parts.push(`Customer message: ${context.formMessage}`)
    }
    parts.push(`Goal: Book appointment or gather more information`)
  }

  if (parts.length === 0) {
    return 'Standard outbound call'
  }

  return parts.join('\n')
}

