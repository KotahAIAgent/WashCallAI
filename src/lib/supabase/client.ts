import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Using 'any' to avoid TypeScript strict checking on database queries
export const createClient = () => {
  return createClientComponentClient<any>()
}

