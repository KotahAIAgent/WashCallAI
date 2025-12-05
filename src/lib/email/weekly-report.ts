'use server'

import { createActionClient } from '@/lib/supabase/server'
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns'

interface WeeklyReportData {
  organizationName: string
  period: {
    from: string
    to: string
  }
  calls: {
    total: number
    inbound: number
    outbound: number
    answered: number
    answerRate: number
  }
  leads: {
    total: number
    interested: number
    booked: number
    conversionRate: number
  }
  appointments: {
    total: number
    upcoming: number
  }
  topCampaign?: {
    name: string
    contacts: number
    interested: number
  }
}

export async function generateWeeklyReportData(organizationId: string): Promise<WeeklyReportData | null> {
  const supabase = createActionClient()

  // Get date range (last 7 days)
  const now = new Date()
  const weekAgo = subDays(now, 7)
  const fromDate = weekAgo.toISOString()
  const toDate = now.toISOString()

  // Get organization info
  const { data: org } = await supabase
    .from('organizations')
    .select('name, email_reports_enabled')
    .eq('id', organizationId)
    .single()

  if (!org?.email_reports_enabled) {
    return null
  }

  // Get calls stats
  const { data: calls } = await supabase
    .from('calls')
    .select('direction, status, duration_seconds')
    .eq('organization_id', organizationId)
    .gte('created_at', fromDate)
    .lte('created_at', toDate)

  // Get leads stats
  const { data: leads } = await supabase
    .from('leads')
    .select('status')
    .eq('organization_id', organizationId)
    .gte('created_at', fromDate)
    .lte('created_at', toDate)

  // Get appointments stats
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, start_time')
    .eq('organization_id', organizationId)
    .gte('created_at', fromDate)
    .lte('created_at', toDate)

  // Get upcoming appointments
  const { data: upcomingAppointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('organization_id', organizationId)
    .gte('start_time', now.toISOString())

  // Get top performing campaign
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('name, contacts_called, contacts_interested')
    .eq('organization_id', organizationId)
    .order('contacts_interested', { ascending: false })
    .limit(1)

  // Calculate call stats
  const totalCalls = calls?.length || 0
  const inboundCalls = calls?.filter(c => c.direction === 'inbound').length || 0
  const outboundCalls = calls?.filter(c => c.direction === 'outbound').length || 0
  const answeredCalls = calls?.filter(c => 
    c.status === 'answered' || c.status === 'completed'
  ).length || 0
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0

  // Calculate lead stats
  const totalLeads = leads?.length || 0
  const interestedLeads = leads?.filter(l => l.status === 'interested').length || 0
  const bookedLeads = leads?.filter(l => l.status === 'booked').length || 0
  const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0

  // Top campaign
  const topCampaign = campaigns && campaigns[0] && campaigns[0].contacts_interested > 0
    ? {
        name: campaigns[0].name,
        contacts: campaigns[0].contacts_called,
        interested: campaigns[0].contacts_interested,
      }
    : undefined

  return {
    organizationName: org?.name || 'Your Business',
    period: {
      from: format(weekAgo, 'MMM d'),
      to: format(now, 'MMM d, yyyy'),
    },
    calls: {
      total: totalCalls,
      inbound: inboundCalls,
      outbound: outboundCalls,
      answered: answeredCalls,
      answerRate,
    },
    leads: {
      total: totalLeads,
      interested: interestedLeads,
      booked: bookedLeads,
      conversionRate,
    },
    appointments: {
      total: appointments?.length || 0,
      upcoming: upcomingAppointments?.length || 0,
    },
    topCampaign,
  }
}

export async function generateWeeklyReportHtml(data: WeeklyReportData): Promise<string> {
  const topCampaignSection = data.topCampaign
    ? `
      <div style="margin-top: 24px; padding: 16px; background: #f0fdf4; border-radius: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #166534;">🏆 Top Campaign</h3>
        <p style="margin: 0; font-weight: 600;">${data.topCampaign.name}</p>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #666;">
          ${data.topCampaign.contacted} called → ${data.topCampaign.interested} interested
        </p>
      </div>
    `
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report - WashCall AI</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px;">📊 Weekly Report</h1>
      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        ${data.period.from} - ${data.period.to}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 24px 0; font-size: 16px;">
        Hi ${data.organizationName} 👋
      </p>
      <p style="margin: 0 0 24px 0; color: #666;">
        Here's your weekly performance summary from WashCall AI:
      </p>

      <!-- Calls Section -->
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">📞 Calls</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #3b82f6;">${data.calls.total}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Total Calls</div>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 28px; font-weight: bold; color: #10b981;">${data.calls.answerRate}%</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Answer Rate</div>
          </div>
        </div>
        <p style="margin: 12px 0 0 0; font-size: 14px; color: #666;">
          ${data.calls.inbound} inbound • ${data.calls.outbound} outbound
        </p>
      </div>

      <!-- Leads Section -->
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">👥 Leads</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${data.leads.total}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">New Leads</div>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${data.leads.interested}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Interested</div>
          </div>
          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${data.leads.booked}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Booked</div>
          </div>
        </div>
      </div>

      <!-- Appointments Section -->
      <div style="margin-bottom: 24px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">📅 Appointments</h2>
        <p style="margin: 0; font-size: 14px; color: #666;">
          ${data.appointments.total} booked this week • ${data.appointments.upcoming} upcoming
        </p>
      </div>

      ${topCampaignSection}

      <!-- CTA -->
      <div style="margin-top: 32px; text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.washcall.ai'}/app/dashboard" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          View Full Dashboard →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        You're receiving this because you have weekly reports enabled.
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.washcall.ai'}/app/settings" style="color: #3b82f6;">
          Manage preferences
        </a>
      </p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} WashCall AI. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendWeeklyReport(organizationId: string, toEmail: string) {
  const data = await generateWeeklyReportData(organizationId)
  
  if (!data) {
    return { error: 'Reports disabled or no data' }
  }

  const html = generateWeeklyReportHtml(data)

  // Use your email provider (Resend, SendGrid, etc.)
  // This is a placeholder - integrate with your actual email service
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'WashCall AI <reports@washcall.ai>',
        to: toEmail,
        subject: `📊 Weekly Report: ${data.period.from} - ${data.period.to}`,
        html,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to send email')
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending weekly report:', error)
    return { error: 'Failed to send email' }
  }
}

export async function sendAllWeeklyReports() {
  const supabase = createActionClient()

  // Get all organizations with reports enabled
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, email')
    .eq('email_reports_enabled', true)
    .not('email', 'is', null)

  if (!orgs || orgs.length === 0) {
    return { sent: 0 }
  }

  let sentCount = 0

  for (const org of orgs) {
    if (org.email) {
      const result = await sendWeeklyReport(org.id, org.email)
      if (result.success) {
        sentCount++
      }
    }
  }

  return { sent: sentCount, total: orgs.length }
}

