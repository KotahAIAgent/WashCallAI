'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  revalidatePath(`/app/leads/${leadId}`)
  revalidatePath('/app/leads')
  return { success: true }
}

