import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

export const createActionClient = () => {
  return createServerActionClient<Database>({ cookies })
}

