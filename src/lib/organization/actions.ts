'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOrganization(formData: FormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const organizationId = formData.get('organizationId') as string
  
  // Validate organizationId is not empty and is a valid UUID
  if (!organizationId || organizationId.trim() === '') {
    return { error: 'Organization ID is required' }
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(organizationId.trim())) {
    return { error: 'Organization ID must be a valid UUID format' }
  }
  
  // Basic info
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const website = formData.get('website') as string
  const description = formData.get('description') as string
  
  // Address
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const zip_code = formData.get('zip_code') as string
  const timezone = formData.get('timezone') as string
  
  // Business details
  const businessHoursStr = formData.get('businessHours') as string
  const serviceAreasStr = formData.get('serviceAreas') as string
  const servicesOfferedStr = formData.get('servicesOffered') as string
  
  // Branding
  const logo_url = formData.get('logo_url') as string
  const primary_color = formData.get('primary_color') as string

  // Parse JSON fields
  let business_hours = null
  let service_areas = null
  let services_offered = null
  
  try {
    if (businessHoursStr) business_hours = JSON.parse(businessHoursStr)
    if (serviceAreasStr) service_areas = JSON.parse(serviceAreasStr)
    if (servicesOfferedStr) services_offered = JSON.parse(servicesOfferedStr)
  } catch (e) {
    console.error('Error parsing JSON fields:', e)
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      name,
      email: email || null,
      phone: phone || null,
      website: website || null,
      description: description || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip_code: zip_code || null,
      timezone: timezone || 'America/New_York',
      business_hours,
      service_areas,
      services_offered,
      logo_url: logo_url || null,
      primary_color: primary_color || '#3B82F6',
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId.trim())

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/settings')
  return { success: true }
}

interface NotificationSettings {
  smsEnabled: boolean
  notifyOnInbound: boolean
  notifyOnInterestedOutbound: boolean
  notifyOnCallback: boolean
  notifyOnBooked: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

interface BusinessPreferences {
  serviceTypes: string[]
  servicesOffered: string[]
  biggestChallenge: string
  callStyle: string
  primaryGoal: string
  additionalNotes: string
}

export async function updateBusinessPreferences(
  organizationId: string,
  preferences: BusinessPreferences
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get existing onboarding data
  const { data: org } = await supabase
    .from('organizations')
    .select('onboarding_data')
    .eq('id', organizationId.trim())
    .single()

  // Merge with existing data
  const existingData = (org?.onboarding_data as Record<string, unknown>) || {}
  const updatedOnboardingData = {
    ...existingData,
    ...preferences,
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      services_offered: preferences.servicesOffered,
      onboarding_data: updatedOnboardingData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId.trim())

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/settings')
  return { success: true }
}

export async function updateNotificationSettings(
  organizationId: string,
  notificationPhone: string,
  settings: NotificationSettings
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Validate phone number format (basic validation)
  if (settings.smsEnabled && !notificationPhone) {
    return { error: 'Phone number is required when SMS is enabled' }
  }

  // Clean phone number (remove formatting)
  const cleanPhone = notificationPhone.replace(/[^\d+]/g, '')

  const { error } = await supabase
    .from('organizations')
    .update({
      notification_phone: cleanPhone || null,
      notification_settings: settings,
    })
    .eq('id', organizationId.trim())

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/settings')
  return { success: true }
}

export async function updateEmailReportsSettings(
  organizationId: string,
  enabled: boolean
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      email_reports_enabled: enabled,
    })
    .eq('id', organizationId.trim())

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app/settings')
  return { success: true }
}

