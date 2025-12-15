/**
 * Codebase knowledge base for chat assistance
 * Provides context about FusionCaller features and functionality
 */

interface SearchResult {
  file: string
  content: string
  score?: number
}

const KNOWLEDGE_BASE = `
FusionCaller is an AI-powered phone calling platform that helps businesses automate their customer communications.

Key Features:
- Inbound AI Calls: Automatically answer incoming calls with AI assistants
- Outbound AI Calls: Make automated outbound calls for campaigns, follow-ups, and lead generation
- Campaign Management: Create and manage calling campaigns for different purposes
- Phone Number Management: Purchase and assign phone numbers for inbound/outbound calling
- CRM Integration: Connect with CRMs like Markate via Zapier for automatic data sync
- Lead Management: Track and manage leads from calls
- Call Analytics: View call history, transcripts, and analytics
- Assistants: Create custom AI assistants with different models (GPT-3.5, GPT-4) and voices

Common Questions:
- How to create an assistant: Go to AI Assistants page, click "Create Assistant", choose inbound or outbound, configure settings
- How to assign a phone number: Click "Assign Phone Number" on an assistant card, select a phone number
- How to create a campaign: Go to Campaigns, click "New Campaign", choose campaign type, add contacts
- Phone number costs: Base cost is $0.11/min for recommended settings (GPT-3.5), higher models cost more
- Recommended settings: GPT-3.5 Turbo with default voice is recommended for best cost/performance balance
- Minutes adjustment: Using more expensive models (GPT-4) reduces available monthly minutes proportionally

Campaign Types:
- Company List: Call a list of companies
- Past Customers: Follow up with previous customers
- Missing Invoices: Call customers with unpaid invoices
- Estimate Follow-up: Follow up on pending estimates
- Form Leads: Automatically call leads from form submissions

Integration:
- Zapier: Connect your CRM via Zapier webhook to automatically sync invoices, estimates, and customer data
- Form Webhooks: Set up webhook URLs to receive form submissions from Facebook/Google Ads and auto-trigger calls
`

export async function codebase_search(options: {
  query: string
  maxResults?: number
}): Promise<SearchResult[]> {
  const { query } = options
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2)

  // Simple keyword matching against knowledge base
  const lowerKB = KNOWLEDGE_BASE.toLowerCase()
  const hasMatch = keywords.some(keyword => lowerKB.includes(keyword))

  if (hasMatch) {
    // Return relevant sections based on keywords
    const sections = KNOWLEDGE_BASE.split('\n\n').filter(section => {
      const lowerSection = section.toLowerCase()
      return keywords.some(keyword => lowerSection.includes(keyword))
    })

    return sections.slice(0, 3).map((content, index) => ({
      file: 'knowledge-base',
      content: content.trim(),
      score: keywords.length,
    }))
  }

  return []
}

