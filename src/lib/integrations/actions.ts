'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface IntegrationRequest {
  integrationName: string
  category: string
  website?: string
  useCase?: string
  priority: string
}

export async function submitIntegrationRequest(
  organizationId: string,
  request: IntegrationRequest
) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get organization and user info for the request
  const { data: org } = await supabase
    .from('organizations')
    .select('name, email')
    .eq('id', organizationId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', session.user.id)
    .single()

  // Store the integration request in the database
  const { error: insertError } = await supabase
    .from('integration_requests')
    .insert({
      organization_id: organizationId,
      user_id: session.user.id,
      integration_name: request.integrationName,
      category: request.category,
      website: request.website || null,
      use_case: request.useCase || null,
      priority: request.priority,
      status: 'pending',
    })

  if (insertError) {
    // If table doesn't exist, try to send email notification instead
    console.log('Could not save to database, sending email notification')
  }

  // Send email notification to admin
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'support@fusioncaller.com'
    
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'FusionCaller <notifications@fusioncaller.com>',
        to: adminEmail,
        subject: `🔌 Integration Request: ${request.integrationName}`,
        html: `
          <h2>New Integration Request</h2>
          <p><strong>Integration:</strong> ${request.integrationName}</p>
          <p><strong>Category:</strong> ${request.category}</p>
          ${request.website ? `<p><strong>Website:</strong> <a href="${request.website}">${request.website}</a></p>` : ''}
          <p><strong>Priority:</strong> ${request.priority}</p>
          ${request.useCase ? `<p><strong>Use Case:</strong> ${request.useCase}</p>` : ''}
          <hr>
          <p><strong>Requested by:</strong> ${profile?.full_name || 'Unknown'}</p>
          <p><strong>Organization:</strong> ${org?.name || 'Unknown'}</p>
          <p><strong>Email:</strong> ${session.user.email}</p>
        `,
      }),
    })
  } catch (emailError) {
    console.error('Error sending integration request email:', emailError)
    // Don't fail the request if email fails
  }

  revalidatePath('/app/integrations')
  return { success: true }
}

export async function getIntegrationRequests(organizationId: string) {
  const supabase = createActionClient()
  
  const { data, error } = await supabase
    .from('integration_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

