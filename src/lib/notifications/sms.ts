import { createServerClient } from '@/lib/supabase/server'

// SMS Templates for different scenarios
const SMS_TEMPLATES = {
  inbound_new_lead: (data: LeadData) => 
    `🔔 NEW LEAD: ${data.name || 'Unknown'} called about ${data.serviceType || 'services'}. Phone: ${data.phone}${data.address ? ` | ${data.address}` : ''}`,
  
  inbound_interested: (data: LeadData) =>
    `🔥 HOT LEAD: ${data.name || 'Unknown'} is interested in ${data.serviceType || 'your services'}! ${data.propertyType ? `(${data.propertyType})` : ''} Phone: ${data.phone}`,
  
  inbound_booked: (data: LeadData) =>
    `📅 BOOKED: ${data.name || 'Unknown'} scheduled an estimate. Phone: ${data.phone}${data.address ? ` | ${data.address}` : ''}`,
  
  outbound_interested: (data: LeadData) =>
    `✅ INTERESTED: ${data.businessName || data.name || 'Contact'} wants to learn more! ${data.notes ? `Notes: ${data.notes}` : ''} Phone: ${data.phone}`,
  
  outbound_callback: (data: LeadData) =>
    `📞 CALLBACK: ${data.businessName || data.name || 'Contact'} requested a callback. Phone: ${data.phone}${data.notes ? ` | ${data.notes}` : ''}`,
  
  outbound_demo: (data: LeadData) =>
    `🎯 DEMO REQUEST: ${data.businessName || data.name || 'Contact'} wants a demo clean! Phone: ${data.phone}${data.address ? ` | ${data.address}` : ''}`,
  
  call_summary: (data: CallSummaryData) =>
    `📱 Call ${data.direction}: ${data.name || data.phone}\n${data.summary || 'Call completed'}\nDuration: ${data.duration}s`,
}

interface LeadData {
  name?: string | null
  phone: string
  businessName?: string | null
  serviceType?: string | null
  propertyType?: string | null
  address?: string | null
  notes?: string | null
}

interface CallSummaryData {
  direction: 'inbound' | 'outbound'
  name?: string | null
  phone: string
  summary?: string | null
  duration?: number
}

interface NotificationSettings {
  smsEnabled: boolean
  notifyOnInbound: boolean
  notifyOnInterestedOutbound: boolean
  notifyOnCallback: boolean
  notifyOnBooked: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

// Check if we're within quiet hours
function isQuietHours(settings: NotificationSettings, timezone: string = 'America/New_York'): boolean {
  if (!settings.quietHoursEnabled) return false
  
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    
    const parts = formatter.formatToParts(now)
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
    const currentTime = hour * 60 + minute
    
    const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number)
    const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    
    // Handle overnight quiet hours (e.g., 21:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime
    }
    
    return currentTime >= startTime && currentTime < endTime
  } catch {
    return false
  }
}

// Send SMS via Twilio
async function sendTwilioSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured')
    return { success: false, error: 'SMS not configured' }
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Twilio error:', error)
      return { success: false, error: error.message || 'Failed to send SMS' }
    }

    return { success: true }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error: 'Failed to send SMS' }
  }
}

// Main function to send notification
export async function sendLeadNotification(
  organizationId: string,
  type: 'inbound_new_lead' | 'inbound_interested' | 'inbound_booked' | 'outbound_interested' | 'outbound_callback' | 'outbound_demo',
  data: LeadData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient()
  
  // Get organization notification settings
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('notification_phone, notification_settings')
    .eq('id', organizationId)
    .single()

  if (orgError || !org) {
    return { success: false, error: 'Organization not found' }
  }

  const settings = (org.notification_settings as NotificationSettings) || { smsEnabled: false }
  
  // Check if SMS is enabled
  if (!settings.smsEnabled) {
    return { success: false, error: 'SMS notifications disabled' }
  }

  // Check notification preferences
  const shouldNotify = 
    (type.startsWith('inbound') && settings.notifyOnInbound) ||
    (type === 'outbound_interested' && settings.notifyOnInterestedOutbound) ||
    (type === 'outbound_callback' && settings.notifyOnCallback) ||
    (type === 'inbound_booked' && settings.notifyOnBooked)

  if (!shouldNotify) {
    return { success: false, error: 'Notification type disabled' }
  }

  // Check quiet hours
  if (isQuietHours(settings)) {
    console.log('Skipping notification - quiet hours')
    return { success: false, error: 'Quiet hours active' }
  }

  // Check if notification phone is set
  if (!org.notification_phone) {
    return { success: false, error: 'No notification phone number configured' }
  }

  // Generate message from template
  const template = SMS_TEMPLATES[type]
  if (!template) {
    return { success: false, error: 'Unknown notification type' }
  }

  const message = template(data)
  
  // Send SMS
  return sendTwilioSMS(org.notification_phone, message)
}

// Send call summary notification
export async function sendCallSummaryNotification(
  organizationId: string,
  data: CallSummaryData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient()
  
  const { data: org } = await supabase
    .from('organizations')
    .select('notification_phone, notification_settings')
    .eq('id', organizationId)
    .single()

  if (!org?.notification_phone) {
    return { success: false, error: 'No notification phone' }
  }

  const settings = (org.notification_settings as NotificationSettings) || { smsEnabled: false }
  
  if (!settings.smsEnabled) {
    return { success: false, error: 'SMS disabled' }
  }

  if (isQuietHours(settings)) {
    return { success: false, error: 'Quiet hours' }
  }

  const message = SMS_TEMPLATES.call_summary(data)
  return sendTwilioSMS(org.notification_phone, message)
}

// Determine notification type from call/lead data
export function determineNotificationType(
  direction: 'inbound' | 'outbound',
  status: string,
  hasAppointment: boolean = false
): 'inbound_new_lead' | 'inbound_interested' | 'inbound_booked' | 'outbound_interested' | 'outbound_callback' | 'outbound_demo' | null {
  if (direction === 'inbound') {
    if (hasAppointment) return 'inbound_booked'
    if (status === 'interested') return 'inbound_interested'
    return 'inbound_new_lead'
  }
  
  if (direction === 'outbound') {
    if (status === 'interested') return 'outbound_interested'
    if (status === 'callback') return 'outbound_callback'
    // Check for demo request in notes/summary
    return null
  }
  
  return null
}

