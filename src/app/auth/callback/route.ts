import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/app/dashboard'

  if (code) {
    const supabase = createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to www.fusioncaller.com after successful email confirmation
      const baseUrl = 'https://www.fusioncaller.com'
      const redirectUrl = new URL(next, baseUrl)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If there's an error or no code, redirect to login on www.fusioncaller.com
  const loginUrl = new URL('https://www.fusioncaller.com/login', request.url)
  return NextResponse.redirect(loginUrl)
}

