import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Using 'any' to avoid TypeScript strict checking on database queries
// For production, generate proper types with: npx supabase gen types typescript
export const createServerClient = () => {
  return createServerComponentClient<any>({ cookies })
}

export const createActionClient = () => {
  return createServerActionClient<any>({ cookies })
}

// Service role client that bypasses RLS - USE ONLY FOR ADMIN OPERATIONS
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

