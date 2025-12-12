'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCall(callId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!profile?.organization_id) {
    return { error: 'No organization found' }
  }

  // Verify the call belongs to the user's organization before deleting
  const { data: call, error: callError } = await supabase
    .from('calls')
    .select('id, organization_id')
    .eq('id', callId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  if (callError) {
    return { error: callError.message }
  }

  if (!call) {
    return { error: 'Call not found or you do not have permission to delete it' }
  }

  // Delete the call
  const { error: deleteError } = await supabase
    .from('calls')
    .delete()
    .eq('id', callId)
    .eq('organization_id', profile.organization_id) // Double-check organization match

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/app/calls')
  return { success: true }
}

