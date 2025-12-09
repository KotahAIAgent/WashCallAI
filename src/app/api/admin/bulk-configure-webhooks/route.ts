/**
 * Admin API endpoint to bulk configure webhooks for all assistants
 * 
 * This endpoint automatically sets the webhook URL for ALL assistants
 * in your Vapi account. Run this once to configure everything.
 * 
 * Usage:
 *   POST /api/admin/bulk-configure-webhooks
 *   (No body needed - uses environment variables)
 */

import { NextResponse } from 'next/server'
import { bulkUpdateAllAssistantsWebhook } from '@/lib/vapi/auto-webhook'

export async function POST() {
  try {
    // Check if user is admin (you can add auth check here)
    // For now, we'll just require VAPI_API_KEY to be set
    
    const result = await bulkUpdateAllAssistantsWebhook()
    
    return NextResponse.json({
      success: true,
      message: `Updated ${result.success} assistants, ${result.failed} failed`,
      details: {
        success: result.success,
        failed: result.failed,
        errors: result.errors,
      },
    })
  } catch (error: any) {
    console.error('[Bulk Webhook] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}

