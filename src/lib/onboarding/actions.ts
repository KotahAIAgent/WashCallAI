'use server'

import { createActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface OnboardingFormData {
  businessName: string
  ownerName: string
  email: string
  phone: string
  website: string
  yearsInBusiness: string
  serviceTypes: string[]
  servicesOffered: string[]
  equipmentOwned: string[]
  crewSize: string
  city: string
  state: string
  serviceRadius: string
  specificAreas: string
  averageJobValue: string
  monthlyRevenue: string
  desiredMonthlyRevenue: string
  biggestChallenge: string
  currentMarketing: string[]
  monthlyMarketingBudget: string
  leadsPerMonth: string
  conversionRate: string
  callStyle: string
  primaryGoal: string
  additionalNotes: string
}

export async function submitOnboardingForm(organizationId: string, formData: OnboardingFormData) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Update organization with form data
  const { error: orgError } = await supabase
    .from('organizations')
    .update({
      name: formData.businessName,
      email: formData.email,
      phone: formData.phone,
      website: formData.website || null,
      city: formData.city,
      state: formData.state,
      services_offered: formData.servicesOffered,
      service_areas: formData.specificAreas ? formData.specificAreas.split(',').map(s => s.trim()) : null,
      onboarding_completed: true,
      onboarding_data: formData,
      setup_status: 'pending',
      setup_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)

  if (orgError) {
    console.error('Error updating organization:', orgError)
    return { error: orgError.message }
  }

  // Update profile with owner name
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: formData.ownerName,
    })
    .eq('id', session.user.id)

  if (profileError) {
    console.error('Error updating profile:', profileError)
  }

  // Send emails in parallel
  await Promise.all([
    sendAdminNotificationEmail(formData, organizationId),
    sendWelcomeEmail(formData),
  ])

  revalidatePath('/app')
  return { success: true }
}

// Welcome email to the customer
async function sendWelcomeEmail(formData: OnboardingFormData) {
  const customerEmail = formData.email
  
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to WashCall AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">WashCall AI</h1>
    </div>
    
    <!-- Main Card -->
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px;">
        Welcome, ${formData.ownerName}! 🎉
      </h2>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Thank you for signing up <strong>${formData.businessName}</strong> with WashCall AI! 
        We're excited to help you never miss another call.
      </p>
      
      <!-- Status Card -->
      <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 16px;">
          📋 What Happens Next?
        </h3>
        <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
          <li><strong>We review your application</strong> (usually within 24 hours)</li>
          <li><strong>We create your custom AI agent</strong> tailored to your business</li>
          <li><strong>We test it</strong> to make sure it sounds perfect</li>
          <li><strong>We notify you</strong> when it's ready to go live!</li>
        </ol>
      </div>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 20px 0;">
        In the meantime, you can:
      </p>
      
      <ul style="color: #52525b; font-size: 15px; line-height: 1.8; margin: 0 0 25px; padding-left: 20px;">
        <li>Explore your dashboard (preview mode)</li>
        <li>Review our pricing plans</li>
        <li>Update your business preferences in Settings</li>
      </ul>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.washcall.ai'}/app/dashboard" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Go to Dashboard →
        </a>
      </div>
      
      <!-- Summary -->
      <div style="border-top: 1px solid #e4e4e7; padding-top: 25px; margin-top: 25px;">
        <h4 style="margin: 0 0 15px; color: #18181b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
          Your Application Summary
        </h4>
        <table style="width: 100%; font-size: 14px; color: #52525b;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;"><strong>Business:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5; text-align: right;">${formData.businessName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;"><strong>Location:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5; text-align: right;">${formData.city}, ${formData.state}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5;"><strong>Services:</strong></td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f4f4f5; text-align: right;">${formData.servicesOffered.slice(0, 3).join(', ')}${formData.servicesOffered.length > 3 ? '...' : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>AI Style:</strong></td>
            <td style="padding: 8px 0; text-align: right;">${formData.callStyle || 'Friendly'}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; color: #a1a1aa; font-size: 13px;">
      <p style="margin: 0 0 10px;">
        Questions? Reply to this email or contact support@washcall.ai
      </p>
      <p style="margin: 0;">
        WashCall AI - Never Miss Another Call
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const emailText = `
Welcome to WashCall AI, ${formData.ownerName}!

Thank you for signing up ${formData.businessName} with WashCall AI! We're excited to help you never miss another call.

WHAT HAPPENS NEXT?
1. We review your application (usually within 24 hours)
2. We create your custom AI agent tailored to your business
3. We test it to make sure it sounds perfect
4. We notify you when it's ready to go live!

In the meantime, you can:
- Explore your dashboard (preview mode)
- Review our pricing plans
- Update your business preferences in Settings

YOUR APPLICATION SUMMARY
Business: ${formData.businessName}
Location: ${formData.city}, ${formData.state}
Services: ${formData.servicesOffered.join(', ')}
AI Style: ${formData.callStyle || 'Friendly'}

Go to your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.washcall.ai'}/app/dashboard

Questions? Reply to this email or contact support@washcall.ai

WashCall AI - Never Miss Another Call
  `.trim()

  // Try to send via Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'WashCall AI <welcome@washcall.ai>',
          to: customerEmail,
          subject: `Welcome to WashCall AI, ${formData.ownerName}! 🎉`,
          html: emailHtml,
          text: emailText,
        }),
      })

      if (response.ok) {
        console.log('Welcome email sent to:', customerEmail)
        return
      }
    } catch (error) {
      console.error('Resend welcome email failed:', error)
    }
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: customerEmail }] }],
          from: { email: 'welcome@washcall.ai', name: 'WashCall AI' },
          subject: `Welcome to WashCall AI, ${formData.ownerName}! 🎉`,
          content: [
            { type: 'text/plain', value: emailText },
            { type: 'text/html', value: emailHtml },
          ],
        }),
      })

      if (response.ok) {
        console.log('Welcome email sent via SendGrid to:', customerEmail)
        return
      }
    } catch (error) {
      console.error('SendGrid welcome email failed:', error)
    }
  }

  console.log('Welcome email not sent (no email provider configured) to:', customerEmail)
}

async function sendAdminNotificationEmail(formData: OnboardingFormData, organizationId: string) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@washcall.ai'
  
  const emailContent = `
New Lead Form Submission!

=== BUSINESS INFO ===
Business Name: ${formData.businessName}
Owner Name: ${formData.ownerName}
Email: ${formData.email}
Phone: ${formData.phone}
Website: ${formData.website || 'N/A'}
Years in Business: ${formData.yearsInBusiness || 'N/A'}

=== SERVICES ===
Customer Types: ${formData.serviceTypes.join(', ') || 'N/A'}
Services Offered: ${formData.servicesOffered.join(', ') || 'N/A'}
Equipment: ${formData.equipmentOwned.join(', ') || 'N/A'}
Crew Size: ${formData.crewSize || 'N/A'}

=== SERVICE AREA ===
Location: ${formData.city}, ${formData.state}
Service Radius: ${formData.serviceRadius || 'N/A'} miles
Specific Areas: ${formData.specificAreas || 'N/A'}

=== BUSINESS GOALS ===
Average Job Value: ${formData.averageJobValue || 'N/A'}
Current Monthly Revenue: ${formData.monthlyRevenue || 'N/A'}
Target Monthly Revenue: ${formData.desiredMonthlyRevenue || 'N/A'}
Biggest Challenge: ${formData.biggestChallenge || 'N/A'}

=== MARKETING ===
Current Channels: ${formData.currentMarketing.join(', ') || 'N/A'}
Monthly Marketing Budget: ${formData.monthlyMarketingBudget || 'N/A'}
Leads Per Month: ${formData.leadsPerMonth || 'N/A'}
Close Rate: ${formData.conversionRate || 'N/A'}

=== AI PREFERENCES ===
Call Style: ${formData.callStyle || 'N/A'}
Primary Goal: ${formData.primaryGoal || 'N/A'}
Additional Notes: ${formData.additionalNotes || 'N/A'}

=== SYSTEM INFO ===
Organization ID: ${organizationId}
Submitted At: ${new Date().toISOString()}

---
Action Required: Review and set up AI agent for this customer.
Admin Panel: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.washcall.ai'}/app/admin
  `.trim()

  // Try Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'WashCall AI <notifications@washcall.ai>',
          to: adminEmail,
          subject: `🚀 New Lead: ${formData.businessName} - ${formData.city}, ${formData.state}`,
          text: emailContent,
        }),
      })

      if (response.ok) {
        console.log('Admin notification email sent via Resend')
        return
      }
    } catch (error) {
      console.error('Resend email failed:', error)
    }
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: adminEmail }] }],
          from: { email: 'notifications@washcall.ai', name: 'WashCall AI' },
          subject: `🚀 New Lead: ${formData.businessName} - ${formData.city}, ${formData.state}`,
          content: [{ type: 'text/plain', value: emailContent }],
        }),
      })

      if (response.ok) {
        console.log('Admin notification email sent via SendGrid')
        return
      }
    } catch (error) {
      console.error('SendGrid email failed:', error)
    }
  }

  // Fallback: Log to console
  console.log('=== ADMIN NOTIFICATION (Email not configured) ===')
  console.log(emailContent)
  console.log('=== END NOTIFICATION ===')
}

export async function getOnboardingStatus(organizationId: string) {
  const supabase = createActionClient()
  
  const { data, error } = await supabase
    .from('organizations')
    .select('onboarding_completed, plan, setup_status')
    .eq('id', organizationId)
    .single()

  if (error) {
    return { onboardingCompleted: false, hasPlan: false, setupStatus: 'pending' }
  }

  return {
    onboardingCompleted: data?.onboarding_completed || false,
    hasPlan: !!data?.plan && data.plan !== null,
    setupStatus: data?.setup_status || 'pending',
  }
}
