'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData): Promise<void> {
  const supabase = createActionClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const organizationName = formData.get('organizationName') as string

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.fusioncaller.com'
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
      data: {
        full_name: fullName,
        organization_name: organizationName || 'My Pressure Washing Company',
      },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (data.user) {
    revalidatePath('/', 'layout')
    redirect('/app/dashboard')
  }
}

export async function signIn(formData: FormData): Promise<void> {
  const supabase = createActionClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.user) {
    revalidatePath('/', 'layout')
    redirect('/app/dashboard')
  }
}

export async function signOut() {
  const supabase = createActionClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

