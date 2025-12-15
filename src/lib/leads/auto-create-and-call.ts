'use server'

import { createServiceRoleClient } from '@/lib/supabase/server'
import { detectServiceFromForm } from '@/lib/ai/service-detector'
import { initiateOutboundCall } from '@/lib/agents/actions'

export interface FormSubmissionData {
  organizationId: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  serviceType?: string
  message?: string
  propertyType?: 'residential' | 'commercial' | 'unknown'
  budget?: string
  timeline?: string
  source?: string // 'facebook', 'google', etc.
  metadata?: Record<string, any>
}

/**
 * Creates a lead from form submission and optionally triggers an immediate call
 */
export async function createLeadAndCall(
  formData: FormSubmissionData,
  options: {
    autoCall?: boolean
    phoneNumberId?: string
  } = {}
): Promise<{ leadId: string; callId?: string; error?: string }> {
  const supabase = createServiceRoleClient()

  try {
    // Detect service type if not provided
    const formText = formData.message || 
                    `${formData.serviceType || ''} ${formData.address || ''}`.trim()
    
    const serviceDetection = await detectServiceFromForm(
      formText,
      formData.serviceType
    )

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        organization_id: formData.organizationId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zipCode || null,
        service_type: serviceDetection.serviceType,
        property_type: serviceDetection.extractedDetails.propertyType || formData.propertyType || 'unknown',
        status: 'new',
        notes: `Source: ${formData.source || 'form'}\nMessage: ${formData.message || 'N/A'}\nDetected Services: ${serviceDetection.detectedServices.join(', ')}`,
      })
      .select()
      .single()

    if (leadError || !lead) {
      console.error('Error creating lead:', leadError)
      return { leadId: '', error: leadError?.message || 'Failed to create lead' }
    }

    // If auto-call is enabled, trigger call immediately
    let callId: string | undefined
    if (options.autoCall) {
      try {
        const callResult = await initiateOutboundCall({
          organizationId: formData.organizationId,
          leadId: lead.id,
          phoneNumberId: options.phoneNumberId,
        })

        if (callResult.error) {
          console.error('Error initiating call:', callResult.error)
          // Don't fail the whole operation if call fails
        } else {
          callId = callResult.callId
        }
      } catch (callError: any) {
        console.error('Error in initiateOutboundCall:', callError)
        // Don't fail the whole operation if call fails
      }
    }

    return { leadId: lead.id, callId }
  } catch (error: any) {
    console.error('Error in createLeadAndCall:', error)
    return { leadId: '', error: error.message || 'Failed to process form submission' }
  }
}

