import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, company, message } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Store demo request in database (you might want to create a demo_requests table)
    // For now, we'll just log it or send an email notification
    console.log('Demo request received:', { name, email, phone, company, message })

    // TODO: Integrate with Calendly API or send email notification
    // TODO: Store in database for tracking

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Demo request error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process demo request' },
      { status: 500 }
    )
  }
}

