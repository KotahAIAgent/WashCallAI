import { PROMPT_TEMPLATES, BusinessData, PromptTemplate } from './templates'

export interface GeneratePromptOptions {
  organizationId: string
  templateId?: string
  type: 'inbound' | 'outbound'
  customData?: Partial<BusinessData>
}

export interface OrganizationData {
  name: string
  industry: string
  description?: string
  services_offered?: string[]
  service_areas?: string[]
  business_hours?: any
  website?: string
  city?: string
  state?: string
}

export async function generatePrompt(
  orgData: OrganizationData,
  options: GeneratePromptOptions
): Promise<{ prompt: string; templateUsed: string }> {
  // Build business data object from organization data
  const businessData: BusinessData = {
    businessName: options.customData?.businessName || orgData.name,
    services: options.customData?.services || orgData.services_offered || [],
    serviceAreas: options.customData?.serviceAreas || orgData.service_areas || [],
    description: options.customData?.description || orgData.description,
    businessHours: options.customData?.businessHours || orgData.business_hours,
    industry: options.customData?.industry || orgData.industry,
    city: options.customData?.city || orgData.city,
    state: options.customData?.state || orgData.state,
  }
  
  // Select template
  let template: PromptTemplate | undefined
  
  if (options.templateId) {
    template = PROMPT_TEMPLATES.find(t => t.id === options.templateId)
  }
  
  if (!template) {
    // Auto-select based on industry and type
    const typeKey = options.type === 'inbound' ? 'inbound' : 'outbound'
    const industryTemplates = PROMPT_TEMPLATES.filter(
      t => (t.industry === businessData.industry || t.industry === 'general') && 
           t.id.includes(typeKey)
    )
    
    // Prefer industry-specific template, fallback to general
    template = industryTemplates.find(t => t.industry === businessData.industry) 
      || industryTemplates.find(t => t.industry === 'general')
      || PROMPT_TEMPLATES.find(t => t.id.includes(typeKey))
      || PROMPT_TEMPLATES[0]
  }
  
  // Generate prompt using template
  const prompt = template.generate(businessData)
  
  return {
    prompt,
    templateUsed: template.id,
  }
}

