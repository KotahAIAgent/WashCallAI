'use server'

import { createActionClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { stripe, STRIPE_PLANS } from '@/lib/stripe/server'
import { getEffectivePlan, hasPrivilege } from '@/lib/admin/utils'

// Re-export utilities for server-side use
export { getEffectivePlan, hasPrivilege }

type SetupStatus = 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'

const STATUS_EMAIL_CONTENT: Record<SetupStatus, { subject: string; title: string; message: string }> = {
  pending: {
    subject: 'Application Received - FusionCaller',
    title: 'Application Received!',
    message: 'We\'ve received your application and will begin reviewing it shortly. You\'ll hear from us within 24 hours.',
  },
  in_review: {
    subject: 'Application Under Review - FusionCaller',
    title: 'Your Application is Being Reviewed',
    message: 'Great news! Our team is now reviewing your application and learning about your business to create the perfect AI agent for you.',
  },
  setting_up: {
    subject: 'Setting Up Your AI Agent - FusionCaller',
    title: 'We\'re Building Your AI Agent! 🔧',
    message: 'Exciting news! We\'re now creating and customizing your AI agent based on your business preferences. This usually takes 1-2 days.',
  },
  testing: {
    subject: 'Testing Your AI Agent - FusionCaller',
    title: 'Your AI Agent is Being Tested 🧪',
    message: 'Your AI agent is built! We\'re now running tests to make sure it sounds perfect and handles calls exactly how you want.',
  },
  ready: {
    subject: '🎉 Your AI Agent is Ready! - FusionCaller',
    title: 'Your AI Agent is Ready to Go Live! 🎉',
    message: 'Great news! Your custom AI agent is fully set up and tested. Choose a plan to activate it and start receiving AI-powered calls today!',
  },
  active: {
    subject: 'You\'re Live! - FusionCaller',
    title: 'Your AI Agent is Now Live! 🚀',
    message: 'Congratulations! Your AI agent is now live and handling calls for your business. Watch your dashboard for incoming leads!',
  },
}

export async function updateSetupStatus(
  organizationId: string,
  status: SetupStatus,
  notes: string,
  sendEmail: boolean
) {
  // Use service role client for admin operations to bypass RLS
  const supabase = createServiceRoleClient()
  
  // Get organization details for email
  const { data: org } = await supabase
    .from('organizations')
    .select('name, email')
    .eq('id', organizationId)
    .single()

  if (!org) {
    return { error: 'Organization not found' }
  }

  let checkoutUrl: string | null = null

  // Get full organization data to check for plan/subscription
  const { data: fullOrg } = await supabase
    .from('organizations')
    .select('plan, billing_customer_id, trial_plan')
    .eq('id', organizationId)
    .single()

  // Update organization status
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      setup_status: status,
      setup_notes: notes || null,
      setup_updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)

  if (updateError) {
    return { error: updateError.message }
  }

  // If status is set to "active", automatically enable agents if they're configured
  if (status === 'active') {
    const { data: agentConfig } = await supabase
      .from('agent_configs')
      .select('id, inbound_agent_id, outbound_agent_id')
      .eq('organization_id', organizationId)
      .single()

    if (agentConfig) {
      const updates: any = {}
      
      // Enable inbound if agent ID exists
      if (agentConfig.inbound_agent_id) {
        updates.inbound_enabled = true
      }
      
      // Enable outbound if agent ID exists
      if (agentConfig.outbound_agent_id) {
        updates.outbound_enabled = true
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await supabase
          .from('agent_configs')
          .update(updates)
          .eq('id', agentConfig.id)
      }
    }
  }

  // When setup is ready/active and assistant is connected, start subscription if plan is selected
  // This ensures payment is charged immediately when they pay
  if ((status === 'ready' || status === 'active') && fullOrg?.plan && stripe) {
    try {
      // Check if they already have a Stripe subscription
      if (fullOrg.billing_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: fullOrg.billing_customer_id,
          status: 'active',
          limit: 1,
        })

        // If no active subscription, create checkout session for immediate payment
        if (subscriptions.data.length === 0) {
          const plan = STRIPE_PLANS[fullOrg.plan as keyof typeof STRIPE_PLANS]
          if (plan) {
            // Create checkout session that charges immediately
            const checkoutSession = await stripe.checkout.sessions.create({
              customer: fullOrg.billing_customer_id,
              payment_method_types: ['card'],
              line_items: [
                {
                  price: plan.priceId,
                  quantity: 1,
                },
              ],
              mode: 'subscription',
              subscription_data: {
                metadata: {
                  organization_id: organizationId,
                  plan: fullOrg.plan,
                  setup_fee_amount: plan.setupFee.toString(),
                  auto_started: 'true', // Flag that this was auto-started
                },
              },
              // Add setup fee as invoice item (charged immediately with first invoice)
              ...(plan.setupFee > 0 && plan.setupFeePriceId ? {
                payment_intent_data: {
                  description: `Setup fee + first month for ${plan.name}`,
                },
              } : {}),
              success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusioncaller.com'}/app/settings?success=true&auto_started=true`,
              cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusioncaller.com'}/app/settings?canceled=true`,
              metadata: {
                organization_id: organizationId,
                plan: fullOrg.plan,
                setup_fee_amount: plan.setupFee.toString(),
              },
            })

            // Add setup fee as invoice item (will be charged immediately with subscription)
            if (plan.setupFee > 0 && plan.setupFeePriceId) {
              await stripe.invoiceItems.create({
                customer: fullOrg.billing_customer_id,
                price: plan.setupFeePriceId,
                description: `One-time setup fee for ${plan.name} plan`,
                metadata: {
                  organization_id: organizationId,
                  plan: fullOrg.plan,
                  setup_fee: 'true',
                },
              })
            }

            console.log(`✅ Auto-created checkout session for org ${organizationId} with plan ${fullOrg.plan}`)
            console.log(`Checkout URL: ${checkoutSession.url}`)
            
            checkoutUrl = checkoutSession.url
            
            // Store checkout URL in organization notes for admin reference
            await supabase
              .from('organizations')
              .update({
                setup_notes: `${notes || ''}\n\n[Auto] Checkout created: ${checkoutSession.url}`.trim(),
              })
              .eq('id', organizationId)
          }
        }
      }
    } catch (error) {
      console.error('Error auto-starting subscription:', error)
      // Don't fail the status update if subscription creation fails
    }
  }

  // Send email if requested and email exists
  if (sendEmail && org.email) {
    await sendStatusUpdateEmail(org.email, org.name, status, checkoutUrl)
  }

  revalidatePath('/app/admin')
  return { success: true }
}

async function sendStatusUpdateEmail(
  customerEmail: string,
  businessName: string,
  status: SetupStatus,
  checkoutUrl: string | null = null
) {
  const content = STATUS_EMAIL_CONTENT[status]
  
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">FusionCaller</h1>
    </div>
    
    <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
      <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px;">
        ${content.title}
      </h2>
      
      <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Hi there! Here's an update on your AI agent setup for <strong>${businessName}</strong>:
      </p>
      
      <div style="background: ${status === 'ready' ? '#dcfce7' : '#eff6ff'}; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid ${status === 'ready' ? '#22c55e' : '#3b82f6'};">
        <p style="margin: 0; color: ${status === 'ready' ? '#166534' : '#1e40af'}; font-size: 15px;">
          ${content.message}
        </p>
      </div>
      
      ${status === 'ready' ? `
      <div style="text-align: center; margin: 30px 0;">
        ${checkoutUrl ? `
        <a href="${checkoutUrl}" 
           style="display: inline-block; background: #22c55e; color: white; padding: 14px 32px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Complete Payment & Go Live →
        </a>
        <p style="color: #71717a; font-size: 13px; margin-top: 10px;">
          Your subscription is ready! Complete payment to activate immediately.
        </p>
        ` : `
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusioncaller.com'}/app/pricing" 
           style="display: inline-block; background: #22c55e; color: white; padding: 14px 32px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Choose a Plan & Go Live →
        </a>
        `}
      </div>
      ` : `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusioncaller.com'}/app/dashboard" 
           style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          Check Your Dashboard →
        </a>
      </div>
      `}
      
      <p style="color: #71717a; font-size: 14px; margin: 20px 0 0;">
        Questions? Just reply to this email and we'll help you out.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; color: #a1a1aa; font-size: 13px;">
      <p style="margin: 0;">FusionCaller - Never Miss Another Call</p>
    </div>
  </div>
</body>
</html>
  `.trim()

  const emailText = `
${content.title}

Hi there! Here's an update on your AI agent setup for ${businessName}:

${content.message}

${status === 'ready' 
  ? (checkoutUrl 
      ? `Complete Payment & Go Live: ${checkoutUrl}\n\nYour subscription is ready! Complete payment to activate immediately.`
      : `Choose a Plan & Go Live: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusioncaller.com'}/app/pricing`)
  : `Check Your Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.fusioncaller.com'}/app/dashboard`
}

Questions? Just reply to this email and we'll help you out.

FusionCaller - Never Miss Another Call
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
          from: 'FusionCaller <updates@fusioncaller.com>',
          to: customerEmail,
          subject: content.subject,
          html: emailHtml,
          text: emailText,
        }),
      })

      if (response.ok) {
        console.log('Status update email sent to:', customerEmail)
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
          personalizations: [{ to: [{ email: customerEmail }] }],
          from: { email: 'updates@fusioncaller.com', name: 'FusionCaller' },
          subject: content.subject,
          content: [
            { type: 'text/plain', value: emailText },
            { type: 'text/html', value: emailHtml },
          ],
        }),
      })

      if (response.ok) {
        console.log('Status update email sent via SendGrid to:', customerEmail)
        return
      }
    } catch (error) {
      console.error('SendGrid email failed:', error)
    }
  }

  console.log('Status update email not sent (no email provider) to:', customerEmail)
}

// ============================================
// ADMIN PRIVILEGE MANAGEMENT
// ============================================

/**
 * Grant a temporary plan upgrade to an organization
 */
export async function adminGrantPlanUpgrade(
  organizationId: string,
  plan: 'starter' | 'growth' | 'pro',
  expiresAt: Date | null,
  notes: string,
  adminEmail: string
) {
  const supabase = createServiceRoleClient()

  // Verify organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    return { error: 'Organization not found' }
  }

  // Update organization with admin-granted plan
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      admin_granted_plan: plan,
      admin_granted_plan_expires_at: expiresAt ? expiresAt.toISOString() : null,
      admin_granted_plan_notes: notes || null,
    })
    .eq('id', organizationId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/app/admin')
  return { success: true, message: `Plan upgrade granted: ${plan} for ${org.name}` }
}

/**
 * Revoke admin-granted plan upgrade
 */
export async function adminRevokePlanUpgrade(
  organizationId: string,
  adminEmail: string
) {
  const supabase = createServiceRoleClient()

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      admin_granted_plan: null,
      admin_granted_plan_expires_at: null,
      admin_granted_plan_notes: null,
    })
    .eq('id', organizationId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/app/admin')
  return { success: true, message: 'Plan upgrade revoked' }
}

/**
 * Grant special privileges to an organization
 */
export async function adminGrantPrivileges(
  organizationId: string,
  privileges: {
    unlimited_calls?: boolean
    bypass_limits?: boolean
    unlimited_campaigns?: boolean
    [key: string]: any
  },
  notes: string,
  adminEmail: string
) {
  const supabase = createServiceRoleClient()

  // Get current privileges
  const { data: org } = await supabase
    .from('organizations')
    .select('admin_privileges')
    .eq('id', organizationId)
    .single()

  const currentPrivileges = (org?.admin_privileges as any) || {}

  // Merge new privileges with existing ones
  const updatedPrivileges = {
    ...currentPrivileges,
    ...privileges,
  }

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      admin_privileges: updatedPrivileges,
      admin_privileges_notes: notes || null,
    })
    .eq('id', organizationId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/app/admin')
  return { success: true, message: 'Privileges granted' }
}

/**
 * Revoke all admin privileges
 */
export async function adminRevokePrivileges(
  organizationId: string,
  adminEmail: string
) {
  const supabase = createServiceRoleClient()

  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      admin_privileges: {},
      admin_privileges_notes: null,
    })
    .eq('id', organizationId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/app/admin')
  return { success: true, message: 'All privileges revoked' }
}

/**
 * Suspend a plan (cancel Stripe subscription but keep plan field in database)
 * This preserves all data while blocking access
 */
export async function adminSuspendPlan(
  organizationId: string,
  adminEmail: string
) {
  const supabase = createServiceRoleClient()

  // Verify organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, plan, billing_customer_id')
    .eq('id', organizationId)
    .maybeSingle()

  if (orgError) {
    console.error('[adminSuspendPlan] Error fetching organization:', orgError)
    return { error: `Database error: ${orgError.message || 'Failed to fetch organization'}` }
  }

  if (!org) {
    console.error('[adminSuspendPlan] Organization not found:', organizationId)
    return { error: `Organization not found with ID: ${organizationId}` }
  }

  if (!org.plan) {
    return { error: 'Organization does not have an active plan to suspend' }
  }

  // Cancel Stripe subscription if it exists
  if (org.billing_customer_id && stripe) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: org.billing_customer_id,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]
        await stripe.subscriptions.cancel(subscription.id)
        console.log(`✓ Canceled Stripe subscription ${subscription.id} for org ${organizationId}`)
      } else {
        console.log(`ℹ No active Stripe subscription found for org ${organizationId}`)
      }
    } catch (error: any) {
      console.error('Error canceling Stripe subscription:', error)
      return { error: `Failed to cancel Stripe subscription: ${error.message}` }
    }
  } else {
    console.log(`ℹ No billing customer ID for org ${organizationId}, skipping Stripe cancellation`)
  }

  // Note: We intentionally keep the plan field in the database
  // The access check will verify Stripe subscription status and block access
  // This preserves all data while effectively suspending service

  revalidatePath('/app/admin')
  return { 
    success: true, 
    message: `Plan suspended for ${org.name}. Stripe subscription canceled. Plan field preserved. Access will be blocked on next call.` 
  }
}

/**
 * Remove all plans from an organization (both regular plan and admin-granted plan)
 * This effectively revokes all subscription access and clears plan data
 */
export async function adminRemoveAllPlans(
  organizationId: string,
  adminEmail: string
) {
  const supabase = createServiceRoleClient()

  // Verify organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, plan, admin_granted_plan, billing_customer_id')
    .eq('id', organizationId)
    .maybeSingle()

  if (orgError) {
    console.error('[adminRemoveAllPlans] Error fetching organization:', orgError)
    return { error: `Database error: ${orgError.message || 'Failed to fetch organization'}` }
  }

  if (!org) {
    console.error('[adminRemoveAllPlans] Organization not found:', organizationId)
    return { error: `Organization not found with ID: ${organizationId}` }
  }

  // Cancel Stripe subscription if it exists
  if (org.billing_customer_id && stripe) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: org.billing_customer_id,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]
        await stripe.subscriptions.cancel(subscription.id)
        console.log(`✓ Canceled Stripe subscription ${subscription.id} for org ${organizationId}`)
      }
    } catch (error: any) {
      console.error('Error canceling Stripe subscription:', error)
      // Continue anyway - we'll still remove the plan from database
    }
  }

  // Remove all plans from database
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      plan: null,
      admin_granted_plan: null,
      admin_granted_plan_expires_at: null,
      admin_granted_plan_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/app/admin')
  return { 
    success: true, 
    message: `All plans removed from ${org.name}. Regular plan: ${org.plan || 'none'}, Admin plan: ${org.admin_granted_plan || 'none'}` 
  }
}

// Utility functions moved to @/lib/admin/utils.ts to allow client component imports

