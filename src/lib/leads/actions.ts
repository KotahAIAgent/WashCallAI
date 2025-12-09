'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { triggerWorkflows } from '@/lib/workflows/engine'

export async function updateLead(formData: FormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  const leadId = formData.get('leadId') as string
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const status = formData.get('status') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase
    .from('leads')
    .update({
      name,
      phone,
      email,
      address,
      city,
      state,
      status,
      notes,
    })
    .eq('id', leadId)

  if (error) {
    return { error: error.message }
  }

  // Get organization ID for workflow trigger
  const { data: lead } = await supabase
    .from('leads')
    .select('organization_id, status')
    .eq('id', leadId)
    .single()

  // Trigger workflow if status changed
  if (lead?.organization_id) {
    const oldStatus = formData.get('oldStatus') as string
    if (oldStatus && oldStatus !== status) {
      await triggerWorkflows('lead_status_changed', {
        organizationId: lead.organization_id,
        leadId,
        triggerData: { oldStatus, newStatus: status },
      })
    }
  }

  revalidatePath(`/app/leads/${leadId}`)
  revalidatePath('/app/leads')
  return { success: true }
}

