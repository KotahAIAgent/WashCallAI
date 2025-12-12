'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCall(callId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // RLS policy will handle authorization - just delete directly
  // The policy ensures users can only delete calls from their organizations
  const { error, count } = await supabase
    .from('calls')
    .delete()
    .eq('id', callId)

  if (error) {
    console.error('[deleteCall] Error:', error)
    return { error: error.message }
  }

  // If count is 0, the call either doesn't exist or user doesn't have permission
  if (count === 0) {
    return { error: 'Call not found or you do not have permission to delete it' }
  }

  revalidatePath('/app/calls')
  return { success: true }
}

