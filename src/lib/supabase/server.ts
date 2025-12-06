import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Using 'any' to avoid TypeScript strict checking on database queries
// For production, generate proper types with: npx supabase gen types typescript
export const createServerClient = () => {
  return createServerComponentClient<any>({ cookies })
}

export const createActionClient = () => {
  return createServerActionClient<any>({ cookies })
}

