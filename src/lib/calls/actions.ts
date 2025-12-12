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
  const { error } = await supabase
    .from('calls')
    .delete()
    .eq('id', callId)

  if (error) {
    console.error('[deleteCall] Error:', error)
    return { error: error.message }
  }

  revalidatePath('/app/calls')
  return { success: true }
}

