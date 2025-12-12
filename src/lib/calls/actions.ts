'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCall(callId: string) {
  try {
    const supabase = createActionClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.error('[deleteCall] Not authenticated')
      return { error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[deleteCall] Error fetching profile:', profileError)
      return { error: profileError.message }
    }

    if (!profile?.organization_id) {
      console.error('[deleteCall] No organization found for user:', session.user.id)
      return { error: 'No organization found' }
    }

    console.log('[deleteCall] Attempting to delete call:', {
      callId,
      organizationId: profile.organization_id,
      userId: session.user.id,
    })

    // Verify the call belongs to the user's organization before deleting
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('id, organization_id')
      .eq('id', callId)
      .eq('organization_id', profile.organization_id)
      .maybeSingle()

    if (callError) {
      console.error('[deleteCall] Error verifying call:', callError)
      return { error: callError.message }
    }

    if (!call) {
      console.error('[deleteCall] Call not found or permission denied:', {
        callId,
        organizationId: profile.organization_id,
      })
      return { error: 'Call not found or you do not have permission to delete it' }
    }

    console.log('[deleteCall] Call verified, proceeding with deletion')

    // Delete the call
    const { error: deleteError, count } = await supabase
      .from('calls')
      .delete()
      .eq('id', callId)
      .eq('organization_id', profile.organization_id) // Double-check organization match

    if (deleteError) {
      console.error('[deleteCall] Error deleting call:', deleteError)
      return { error: deleteError.message }
    }

    console.log('[deleteCall] ✅ Call deleted successfully:', {
      callId,
      rowsDeleted: count,
    })

    revalidatePath('/app/calls')
    return { success: true }
  } catch (error: any) {
    console.error('[deleteCall] Unexpected error:', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}

