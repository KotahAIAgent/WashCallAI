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
 * Get the access check function URL for Vapi assistants
 * This is called by the assistant as a function at the start of calls
 */
export function getAccessCheckUrl(): string {
  const customUrl = process.env.VAPI_ACCESS_CHECK_URL
  if (customUrl) {
    return customUrl
  }

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}/api/vapi/check-access`
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return `${appUrl}/api/vapi/check-access`
  }

  return 'https://your-domain.com/api/vapi/check-access'
}

/**
 * Automatically set webhook URL for a Vapi assistant
 * Call this whenever you create or update an assistant
 * 
 * Note: Vapi's API structure may vary. This sets:
 * - serverUrl: For call event webhooks (status updates, transcripts, etc.)
 * - functions: Adds access check function that assistant can call at start of calls
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
  const accessCheckUrl = getAccessCheckUrl()

  try {
    // First, get current assistant config to preserve existing functions
    const getResponse = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    let existingFunctions: any[] = []
    let assistantData: any = null
    if (getResponse.ok) {
      assistantData = await getResponse.json()
      existingFunctions = assistantData?.functions || assistantData?.tools || []
    }

    // Check if access check function already exists
    const hasAccessCheck = existingFunctions.some((f: any) => 
      f.name === 'check_access' || 
      f.name === 'verify_subscription' ||
      (f.url && f.url.includes('/check-access'))
    )

    // Build update payload
    const updatePayload: any = {
      serverUrl: webhookUrl, // For call event webhooks
    }

    // Add access check function if it doesn't exist
    if (!hasAccessCheck) {
      const accessCheckFunction = {
        type: 'webhook',
        name: 'check_access',
        description: 'Check if the organization has an active subscription before proceeding with the call. Call this function at the very start of every call.',
        url: accessCheckUrl,
        method: 'POST',
      }

      // Vapi may use 'functions' or 'tools' field
      updatePayload.functions = [...existingFunctions, accessCheckFunction]
      // Also try 'tools' in case that's what Vapi uses
      if (existingFunctions.length === 0 && !assistantData?.functions) {
        updatePayload.tools = [accessCheckFunction]
      }
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
      
      // Try without functions if that failed
      if (updatePayload.functions || updatePayload.tools) {
        console.log('[Auto-Webhook] Retrying without functions...')
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
          console.log(`[Auto-Webhook] ✅ Webhook configured (without access check function) for assistant ${assistantId}`)
          console.log(`[Auto-Webhook] ⚠️ Note: Access check function needs to be configured manually in Vapi dashboard`)
          return { success: true }
        }
      }
      
      return { success: false, error: `Failed to update assistant: ${error}` }
    }

    console.log(`[Auto-Webhook] ✅ Webhook and access check function configured for assistant ${assistantId}`)
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

