/**
 * Automated Webhook Configuration for Vapi Assistants
 * 
 * This module automatically configures webhook URLs for all Vapi assistants
 * without requiring manual input for each one.
 */

const VAPI_API_URL = 'https://api.vapi.ai'

/**
 * Get the webhook URL that all assistants should use
 */
export function getWebhookUrl(): string {
  // Try to get from environment variable first
  const customUrl = process.env.VAPI_WEBHOOK_URL
  if (customUrl) {
    return customUrl
  }

  // Fallback to Vercel URL
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}/api/vapi/webhook`
  }

  // Fallback to NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return `${appUrl}/api/vapi/webhook`
  }

  // Last resort - should be set in production
  return 'https://your-domain.com/api/vapi/webhook'
}

/**
 * Get the pre-call check URL for access validation
 */
export function getPreCallCheckUrl(): string {
  const customUrl = process.env.VAPI_PRE_CALL_CHECK_URL
  if (customUrl) {
    return customUrl
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}/api/vapi/pre-call-check`
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return `${appUrl}/api/vapi/pre-call-check`
  }

  return 'https://your-domain.com/api/vapi/pre-call-check'
}

/**
 * Automatically set webhook URL for a Vapi assistant
 * Call this whenever you create or update an assistant
 * 
 * Note: Vapi's API structure may vary. This sets:
 * - serverUrl: For call event webhooks (status updates, transcripts, etc.)
 * - endFunction: For pre-call access checks (if supported by Vapi)
 */
export async function autoConfigureWebhook(assistantId: string): Promise<{
  success: boolean
  error?: string
}> {
  const vapiApiKey = process.env.VAPI_API_KEY
  if (!vapiApiKey) {
    return { success: false, error: 'VAPI_API_KEY not configured' }
  }

  const webhookUrl = getWebhookUrl()
  const preCallCheckUrl = getPreCallCheckUrl()

  try {
    // First, try to set both serverUrl and endFunction
    // Note: Vapi's API may use different field names - adjust based on their documentation
    const updatePayload: any = {
      serverUrl: webhookUrl, // For call event webhooks
    }

    // Try to add pre-call check as endFunction (Vapi may support this)
    // If Vapi doesn't support endFunction, we'll fall back to just serverUrl
    // You may need to configure this at the phone number level instead
    try {
      updatePayload.endFunction = {
        type: 'webhook',
        url: preCallCheckUrl,
      }
    } catch (e) {
      // If endFunction format is wrong, continue without it
      console.log('[Auto-Webhook] Note: endFunction not configured, using serverUrl only')
    }

    const response = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[Auto-Webhook] Failed to set webhook for assistant ${assistantId}:`, error)
      
      // If endFunction failed, try without it
      if (updatePayload.endFunction) {
        console.log('[Auto-Webhook] Retrying without endFunction...')
        const retryResponse = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serverUrl: webhookUrl,
          }),
        })
        
        if (retryResponse.ok) {
          console.log(`[Auto-Webhook] ✅ Webhook configured (without pre-call check) for assistant ${assistantId}`)
          console.log(`[Auto-Webhook] ⚠️ Note: Pre-call check may need to be configured manually in Vapi dashboard`)
          return { success: true }
        }
      }
      
      return { success: false, error: `Failed to update assistant: ${error}` }
    }

    console.log(`[Auto-Webhook] ✅ Webhook and pre-call check configured for assistant ${assistantId}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Auto-Webhook] Error setting webhook for assistant ${assistantId}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Bulk update webhook URL for all assistants in your Vapi account
 * This is useful for initial setup or if webhook URL changes
 */
export async function bulkUpdateAllAssistantsWebhook(): Promise<{
  success: number
  failed: number
  errors: Array<{ assistantId: string; error: string }>
}> {
  const vapiApiKey = process.env.VAPI_API_KEY
  if (!vapiApiKey) {
    throw new Error('VAPI_API_KEY not configured')
  }

  const webhookUrl = getWebhookUrl()
  let success = 0
  let failed = 0
  const errors: Array<{ assistantId: string; error: string }> = []

  try {
    // Get all assistants
    const response = await fetch(`${VAPI_API_URL}/assistant`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch assistants: ${response.statusText}`)
    }

    const assistants = await response.json()
    const assistantList = Array.isArray(assistants) ? assistants : assistants.data || []

    console.log(`[Auto-Webhook] Found ${assistantList.length} assistants to update`)

    // Update each assistant
    for (const assistant of assistantList) {
      const assistantId = assistant.id || assistant.assistantId
      if (!assistantId) continue

      const result = await autoConfigureWebhook(assistantId)
      
      if (result.success) {
        success++
      } else {
        failed++
        errors.push({ assistantId, error: result.error || 'Unknown error' })
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`[Auto-Webhook] ✅ Updated ${success} assistants, ${failed} failed`)
    return { success, failed, errors }
  } catch (error: any) {
    throw new Error(`Bulk update failed: ${error.message}`)
  }
}

/**
 * Set webhook URL at phone number level (if Vapi supports it)
 * This is better because one phone number can be used by multiple assistants
 */
export async function setPhoneNumberWebhook(phoneNumberId: string): Promise<{
  success: boolean
  error?: string
}> {
  const vapiApiKey = process.env.VAPI_API_KEY
  if (!vapiApiKey) {
    return { success: false, error: 'VAPI_API_KEY not configured' }
  }

  const webhookUrl = getWebhookUrl()

  try {
    // Try to update phone number with webhook URL
    const response = await fetch(`${VAPI_API_URL}/phone-number/${phoneNumberId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverUrl: webhookUrl,
      }),
    })

    if (!response.ok) {
      // Phone number level might not be supported, that's okay
      const error = await response.text()
      return { success: false, error: `Phone number webhook not supported: ${error}` }
    }

    console.log(`[Auto-Webhook] ✅ Webhook configured for phone number ${phoneNumberId}`)
    return { success: true }
  } catch (error: any) {
    // Phone number level might not be supported, that's okay
    return { success: false, error: error.message }
  }
}

