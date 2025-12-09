/**
 * Vapi Assistant Utilities
 * Helper functions for managing Vapi assistants at scale
 */

const VAPI_API_URL = 'https://api.vapi.ai'

/**
 * Get the webhook URL for all assistants
 * This should be set once and used for all assistants
 */
export function getWebhookUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://your-domain.com' // Fallback - should be set in production
  
  return `${baseUrl}/api/vapi/webhook`
}

/**
 * Create a new Vapi assistant with webhook URL automatically configured
 */
export async function createAssistantWithWebhook(config: {
  name: string
  model?: any
  voice?: any
  firstMessage?: string
  systemPrompt?: string
  [key: string]: any
}): Promise<{ success: boolean; assistantId?: string; error?: string }> {
  const vapiApiKey = process.env.VAPI_API_KEY
  if (!vapiApiKey) {
    return { success: false, error: 'VAPI_API_KEY not configured' }
  }

  const webhookUrl = getWebhookUrl()

  try {
    const response = await fetch(`${VAPI_API_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...config,
        serverUrl: webhookUrl, // Automatically set webhook URL
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Failed to create assistant: ${error}` }
    }

    const data = await response.json()
    return { success: true, assistantId: data.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing assistant to use the webhook URL
 */
export async function updateAssistantWebhook(
  assistantId: string
): Promise<{ success: boolean; error?: string }> {
  const vapiApiKey = process.env.VAPI_API_KEY
  if (!vapiApiKey) {
    return { success: false, error: 'VAPI_API_KEY not configured' }
  }

  const webhookUrl = getWebhookUrl()

  try {
    const response = await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
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
      const error = await response.text()
      return { success: false, error: `Failed to update assistant: ${error}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Bulk update all assistants to use the webhook URL
 * Note: This requires listing all assistants first (Vapi API may have limits)
 */
export async function bulkUpdateAssistantsWebhook(
  assistantIds: string[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const assistantId of assistantIds) {
    const result = await updateAssistantWebhook(assistantId)
    if (result.success) {
      success++
    } else {
      failed++
      errors.push(`${assistantId}: ${result.error}`)
    }
    
    // Rate limiting - wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { success, failed, errors }
}

