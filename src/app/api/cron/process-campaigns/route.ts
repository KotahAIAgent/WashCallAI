import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { initiateOutboundCall } from '@/lib/agents/actions'

/**
 * Cron job to process active campaigns and initiate calls
 * Should be called periodically (e.g., every 5-15 minutes)
 * 
 * POST /api/cron/process-campaigns
 * 
 * Set up with Vercel Cron or external cron service:
 * vercel.json: { "crons": [{ "path": "/api/cron/process-campaigns", "schedule": "*/10 * * * *" }] }
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    // Get all active campaigns
    const { data: activeCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, organization_id, phone_number_id, daily_limit, schedule')
      .eq('status', 'active')

    if (campaignsError) {
      console.error('Error fetching active campaigns:', campaignsError)
      return NextResponse.json({ error: campaignsError.message }, { status: 500 })
    }

    if (!activeCampaigns || activeCampaigns.length === 0) {
      return NextResponse.json({ 
        message: 'No active campaigns to process',
        processed: 0 
      })
    }

    console.log(`Found ${activeCampaigns.length} active campaigns to process`)

    let totalCallsInitiated = 0
    let totalErrors = 0

    for (const campaign of activeCampaigns) {
      try {
        // Get agent config for this organization
        const { data: agentConfig } = await supabase
          .from('agent_configs')
          .select('*')
          .eq('organization_id', campaign.organization_id)
          .single()

        if (!agentConfig || !agentConfig.outbound_agent_id || !agentConfig.outbound_enabled) {
          console.log(`Skipping campaign ${campaign.id}: agent not configured or disabled`)
          continue
        }

        // Check schedule if configured
        if (agentConfig.schedule) {
          const schedule = agentConfig.schedule as { enabledDays: string[]; startTime: string; endTime: string; timezone: string }
          const now = new Date()
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: schedule.timezone,
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          
          const parts = formatter.formatToParts(now)
          const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase()
          const hour = parts.find(p => p.type === 'hour')?.value
          const minute = parts.find(p => p.type === 'minute')?.value
          
          if (weekday && hour && minute) {
            // Check if within schedule
            if (!schedule.enabledDays.includes(weekday)) {
              console.log(`Skipping campaign ${campaign.id}: not a calling day (${weekday})`)
              continue
            }

            const currentTime = `${hour}:${minute}`
            if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
              console.log(`Skipping campaign ${campaign.id}: outside calling hours (${currentTime})`)
              continue
            }
          }
        }

        // Get phone number for this campaign (use campaign phone or agent config phone)
        let phoneNumberId = campaign.phone_number_id
        
        if (!phoneNumberId && agentConfig.schedule) {
          const schedule = agentConfig.schedule as { selectedPhoneId?: string }
          phoneNumberId = schedule.selectedPhoneId || null
        }

        if (!phoneNumberId) {
          // Get first available outbound phone number
          const { data: phoneNumbers } = await supabase
            .from('phone_numbers')
            .select('id')
            .eq('organization_id', campaign.organization_id)
            .eq('active', true)
            .in('type', ['outbound', 'both'])
            .limit(1)

          if (phoneNumbers && phoneNumbers.length > 0) {
            phoneNumberId = phoneNumbers[0].id
          }
        }

        if (!phoneNumberId) {
          console.log(`Skipping campaign ${campaign.id}: no phone number available`)
          continue
        }

        // Get pending contacts for this campaign (limit to avoid overwhelming)
        const { data: pendingContacts, error: contactsError } = await supabase
          .from('campaign_contacts')
          .select('id, phone, name, business_name, call_count, last_call_at')
          .eq('campaign_id', campaign.id)
          .eq('status', 'pending')
          .limit(10) // Process up to 10 contacts per campaign per run

        if (contactsError) {
          console.error(`Error fetching contacts for campaign ${campaign.id}:`, contactsError)
          continue
        }

        if (!pendingContacts || pendingContacts.length === 0) {
          continue
        }

        // Check daily limit for phone number
        const { data: phoneNumber } = await supabase
          .from('phone_numbers')
          .select('calls_today, daily_limit, last_reset_date')
          .eq('id', phoneNumberId)
          .single()

        if (!phoneNumber) {
          console.log(`Skipping campaign ${campaign.id}: phone number not found`)
          continue
        }

        const today = new Date().toISOString().split('T')[0]
        let availableCalls = phoneNumber.daily_limit - phoneNumber.calls_today

        if (phoneNumber.last_reset_date !== today) {
          // Reset counter for new day
          await supabase
            .from('phone_numbers')
            .update({ calls_today: 0, last_reset_date: today })
            .eq('id', phoneNumberId)
          availableCalls = phoneNumber.daily_limit
        }

        if (availableCalls <= 0) {
          console.log(`Skipping campaign ${campaign.id}: daily limit reached for phone number`)
          continue
        }

        // Process contacts (up to available calls)
        let callsInitiated = 0
        for (const contact of pendingContacts.slice(0, Math.min(availableCalls, 10))) {
          // Check if contact has been called 2+ times today
          if (contact.last_call_at) {
            const lastCallDate = new Date(contact.last_call_at).toISOString().split('T')[0]
            if (lastCallDate === today && contact.call_count >= 2) {
              continue // Skip this contact, already called 2x today
            }
          }

          // Initiate call using service role client context
          // Note: initiateOutboundCall uses createActionClient which requires a session
          // We need to create a server-side version or use a different approach
          // For now, we'll make the Vapi API call directly here
          try {
            const vapiApiKey = process.env.VAPI_API_KEY
            if (!vapiApiKey) {
              console.error('Vapi API key not configured')
              continue
            }

            // Get organization data for custom variables
            const { data: organization } = await supabase
              .from('organizations')
              .select('name, service_areas, city, state')
              .eq('id', campaign.organization_id)
              .single()

            // Build custom variables
            const customVariables: Record<string, any> = {
              businessName: agentConfig.custom_business_name || organization?.name || 'Business',
              serviceArea: agentConfig.custom_service_area || 
                           (organization?.service_areas && organization.service_areas.length > 0 
                             ? organization.service_areas.join(', ') 
                             : `${organization?.city || ''} ${organization?.state || ''}`.trim()),
              ...(agentConfig.custom_greeting && { customGreeting: agentConfig.custom_greeting }),
              ...(agentConfig.custom_variables || {}),
            }

            // Get phone number provider ID
            const { data: phoneNumberData } = await supabase
              .from('phone_numbers')
              .select('provider_phone_id, phone_number')
              .eq('id', phoneNumberId)
              .single()

            if (!phoneNumberData) {
              continue
            }

            // Make the call via Vapi
            const response = await fetch('https://api.vapi.ai/call/phone', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${vapiApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                assistantId: agentConfig.outbound_agent_id,
                phoneNumberId: phoneNumberData.provider_phone_id,
                customer: {
                  number: contact.phone,
                  name: contact.name || contact.business_name || undefined,
                },
                variables: customVariables,
                metadata: {
                  organizationId: campaign.organization_id,
                  campaignContactId: contact.id,
                  phoneNumberId: phoneNumberId,
                },
              }),
            })

            if (!response.ok) {
              const errorData = await response.json()
              console.error(`Vapi API error for contact ${contact.id}:`, errorData)
              totalErrors++
              continue
            }

            const callData = await response.json()

            // Log the call
            await supabase.from('calls').insert({
              organization_id: campaign.organization_id,
              campaign_contact_id: contact.id,
              direction: 'outbound',
              provider_call_id: callData.id,
              from_number: phoneNumberData.phone_number,
              to_number: contact.phone,
              status: 'queued',
              raw_payload: callData,
            })

            // Update phone number call count
            await supabase
              .from('phone_numbers')
              .update({ calls_today: (phoneNumber.calls_today || 0) + 1 })
              .eq('id', phoneNumberId)

            // Update campaign contact
            await supabase
              .from('campaign_contacts')
              .update({
                status: 'queued',
                call_count: (contact.call_count || 0) + 1,
              })
              .eq('id', contact.id)

            callsInitiated++
            totalCallsInitiated++

            // Small delay between calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (error) {
            console.error(`Error initiating call for contact ${contact.id}:`, error)
            totalErrors++
          }
        }

        console.log(`✓ Processed campaign ${campaign.id}: ${callsInitiated} calls initiated`)

      } catch (err) {
        console.error(`Error processing campaign ${campaign.id}:`, err)
        totalErrors++
      }
    }

    return NextResponse.json({
      message: `Processed ${activeCampaigns.length} active campaigns`,
      campaignsProcessed: activeCampaigns.length,
      callsInitiated: totalCallsInitiated,
      errors: totalErrors,
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also allow GET for easy testing
export async function GET(request: Request) {
  return POST(request)
}

