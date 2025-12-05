import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      email,
      address,
      city,
      state,
      zip_code,
      property_type,
      service_type,
      status,
      notes,
    } = body

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        organization_id: profile.organization_id,
        name,
        phone,
        email,
        address,
        city,
        state,
        zip_code,
        property_type: property_type || 'unknown',
        service_type,
        status: status || 'new',
        notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

