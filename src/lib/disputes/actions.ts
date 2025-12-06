'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Statuses that count toward billing
export const BILLABLE_STATUSES = ['answered', 'interested', 'not_interested', 'callback', 'completed']

// ============================================
// CUSTOMER ACTIONS
// ============================================

export async function submitDispute({
  organizationId,
  callId,
  campaignContactId,
  callDate,
  callDuration,
  callOutcome,
  phoneNumber,
  reason,
}: {
  organizationId: string
  callId?: string
  campaignContactId?: string
  callDate: string
  callDuration?: number
  callOutcome: string
  phoneNumber?: string
  reason: string
}) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Verify user belongs to this organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('profile_id', session.user.id)
    .single()

  if (!member) {
    return { error: 'Not authorized' }
  }

  // Check if a dispute already exists for this call
  const existingQuery = supabase
    .from('call_disputes')
    .select('id')
    .eq('organization_id', organizationId)

  if (callId) {
    existingQuery.eq('call_id', callId)
  } else if (campaignContactId) {
    existingQuery.eq('campaign_contact_id', campaignContactId)
  }

  const { data: existingDispute } = await existingQuery.single()

  if (existingDispute) {
    return { error: 'A dispute has already been submitted for this call' }
  }

  // Create the dispute
  const { data, error } = await supabase
    .from('call_disputes')
    .insert({
      organization_id: organizationId,
      call_id: callId || null,
      campaign_contact_id: campaignContactId || null,
      call_date: callDate,
      call_duration: callDuration || null,
      call_outcome: callOutcome,
      phone_number: phoneNumber || null,
      reason,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating dispute:', error)
    return { error: error.message }
  }

  revalidatePath('/app/disputes')
  return { success: true, dispute: data }
}

export async function getMyDisputes(organizationId: string) {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('call_disputes')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching disputes:', error)
    return { error: error.message }
  }

  return { disputes: data }
}

export async function getUsageStats(organizationId: string) {
  const supabase = createActionClient()

  // Get organization billing info
  const { data: org } = await supabase
    .from('organizations')
    .select('plan, billable_calls_this_month, billing_period_month, billing_period_year')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return { error: 'Organization not found' }
  }

  // Check if we're in a new billing period
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  let billableCallsThisMonth = org.billable_calls_this_month || 0

  // Reset if new month
  if (org.billing_period_month !== currentMonth || org.billing_period_year !== currentYear) {
    billableCallsThisMonth = 0
  }

  // Get plan limits
  const planLimits: Record<string, number> = {
    starter: 0,
    growth: 500,
    pro: 2500,
  }

  const monthlyLimit = planLimits[org.plan || 'starter'] || 0

  // Get pending disputes count
  const { count: pendingDisputes } = await supabase
    .from('call_disputes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'pending')

  // Get approved disputes this month (credits refunded)
  const { count: refundedCredits } = await supabase
    .from('call_disputes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'approved')
    .eq('credit_refunded', true)
    .gte('reviewed_at', new Date(currentYear, currentMonth - 1, 1).toISOString())

  return {
    plan: org.plan,
    billableCallsThisMonth,
    monthlyLimit,
    remainingCalls: monthlyLimit === 0 ? 0 : monthlyLimit - billableCallsThisMonth + (refundedCredits || 0),
    pendingDisputes: pendingDisputes || 0,
    refundedCredits: refundedCredits || 0,
    billingPeriod: {
      month: currentMonth,
      year: currentYear,
    },
  }
}

// ============================================
// ADMIN ACTIONS
// ============================================

export async function getAllDisputes() {
  const supabase = createActionClient()

  const { data, error } = await supabase
    .from('call_disputes')
    .select(`
      *,
      organizations:organization_id (
        id,
        name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all disputes:', error)
    return { error: error.message }
  }

  return { disputes: data }
}

export async function reviewDispute({
  disputeId,
  status,
  adminNotes,
  adminEmail,
}: {
  disputeId: string
  status: 'approved' | 'denied'
  adminNotes?: string
  adminEmail: string
}) {
  const supabase = createActionClient()

  // Get the dispute first
  const { data: dispute } = await supabase
    .from('call_disputes')
    .select('*, organizations:organization_id (email, billable_calls_this_month)')
    .eq('id', disputeId)
    .single()

  if (!dispute) {
    return { error: 'Dispute not found' }
  }

  // Update the dispute
  const { error: updateError } = await (supabase
    .from('call_disputes') as any)
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
      credit_refunded: status === 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)

  if (updateError) {
    console.error('Error updating dispute:', updateError)
    return { error: updateError.message }
  }

  // If approved, decrement the billable calls count
  if (status === 'approved') {
    const org = dispute.organizations as any
    const currentCount = org?.billable_calls_this_month || 0

    if (currentCount > 0) {
      await (supabase
        .from('organizations') as any)
        .update({
          billable_calls_this_month: currentCount - 1,
        })
        .eq('id', dispute.organization_id)
    }
  }

  // Send email notification to customer about dispute resolution
  const org = dispute.organizations as any
  if (org?.email) {
    await sendDisputeResolutionEmail({
      to: org.email,
      organizationName: org.name || 'Customer',
      status,
      adminNotes: adminNotes || undefined,
      callDate: dispute.call_date,
      callOutcome: dispute.call_outcome,
    })
  }

  revalidatePath('/app/admin/disputes')
  revalidatePath('/app/disputes')
  return { success: true }
}

async function sendDisputeResolutionEmail({
  to,
  organizationName,
  status,
  adminNotes,
  callDate,
  callOutcome,
}: {
  to: string
  organizationName: string
  status: 'approved' | 'denied'
  adminNotes?: string
  callDate: string
  callOutcome: string
}) {
  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY
  
  if (!apiKey) {
    console.log('No email API key configured, skipping dispute resolution email')
    return
  }

  const formattedDate = new Date(callDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const subject = status === 'approved' 
    ? '✅ Your Call Dispute Has Been Approved'
    : '❌ Your Call Dispute Has Been Reviewed'

  const statusMessage = status === 'approved'
    ? `<p style="font-size: 16px; color: #16a34a; font-weight: 600;">
        Good news! Your dispute has been <strong>approved</strong> and the call credit has been refunded to your account.
       </p>`
    : `<p style="font-size: 16px; color: #dc2626; font-weight: 600;">
        After reviewing the call recording, we've determined that the call was correctly charged and your dispute has been <strong>denied</strong>.
       </p>`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e5e7eb; }
        .content { padding: 30px 0; }
        .call-details { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: #1f2937; margin: 0;">WashCall AI</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Dispute Resolution</p>
        </div>
        
        <div class="content">
          <p>Hi ${organizationName},</p>
          
          ${statusMessage}
          
          <div class="call-details">
            <p style="margin: 0 0 10px 0;"><strong>Call Details:</strong></p>
            <p style="margin: 5px 0;">Date: ${formattedDate}</p>
            <p style="margin: 5px 0;">Outcome: ${callOutcome}</p>
          </div>
          
          ${adminNotes ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 5px 0; font-weight: 600;">Admin Notes:</p>
              <p style="margin: 0; color: #78350f;">${adminNotes}</p>
            </div>
          ` : ''}
          
          <p>
            ${status === 'approved' 
              ? 'The credit has been automatically added back to your monthly allocation.'
              : 'If you believe this decision was made in error, please contact our support team.'}
          </p>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/disputes" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Your Disputes
            </a>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} WashCall AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    if (process.env.RESEND_API_KEY) {
      // Use Resend
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'WashCall AI <noreply@washcallai.com>',
          to,
          subject,
          html: htmlContent,
        }),
      })
    } else if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.FROM_EMAIL || 'noreply@washcallai.com' },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      })
    }
    console.log(`Dispute resolution email sent to ${to}`)
  } catch (error) {
    console.error('Failed to send dispute resolution email:', error)
  }
}

export async function getDisputeDetails(disputeId: string) {
  const supabase = createActionClient()

  const { data: dispute, error } = await supabase
    .from('call_disputes')
    .select(`
      *,
      organizations:organization_id (
        id,
        name,
        email,
        phone
      ),
      calls:call_id (
        id,
        recording_url,
        transcript,
        summary,
        duration_seconds
      ),
      campaign_contacts:campaign_contact_id (
        id,
        name,
        phone,
        last_call_summary,
        last_call_transcript,
        last_call_duration
      )
    `)
    .eq('id', disputeId)
    .single()

  if (error) {
    console.error('Error fetching dispute details:', error)
    return { error: error.message }
  }

  return { dispute }
}

