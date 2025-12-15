'use server'

import { createActionClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createAssistantWithWebhook } from '@/lib/vapi/assistant-utils'
import { revalidatePath } from 'next/cache'

const VAPI_API_URL = 'https://api.vapi.ai'

interface CreateAssistantParams {
  organizationId: string
  name: string
  type: 'inbound' | 'outbound'
  model?: string
  voiceId?: string
  voiceName?: string
  firstMessage?: string
  systemPrompt?: string
  settings?: Record<string, any>
}

export async function createAssistant(params: CreateAssistantParams) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Verify user has access to this organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('profile_id', session.user.id)
    .eq('organization_id', params.organizationId)
    .single()

  if (!member) {
    return { error: 'Unauthorized - you do not have access to this organization' }
  }

  const vapiApiKey = process.env.VAPI_API_KEY
  if (!vapiApiKey) {
    return { error: 'Assistant creation is not configured. Please contact support.' }
  }

  try {
    // Prepare assistant config for VAPI
    const modelName = params.model || 'gpt-3.5-turbo'
    const assistantConfig: any = {
      name: params.name,
      model: {
        provider: 'openai',
        model: modelName,
        temperature: 0.7,
        messages: params.systemPrompt ? [
          {
            role: 'system',
            content: params.systemPrompt,
          },
        ] : undefined,
      },
      voice: params.voiceId ? {
        provider: '11labs',
        voiceId: params.voiceId,
      } : {
        provider: '11labs',
        voiceId: '21m00Tcm4TlvDq8ikWAM', // Default voice
      },
      firstMessage: params.firstMessage || 'Hello! How can I help you today?',
    }

    // Create assistant via VAPI API
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`
      : 'https://your-domain.com/api/vapi/webhook'

    const response = await fetch(`${VAPI_API_URL}/assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...assistantConfig,
        serverUrl: webhookUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[createAssistant] Failed to create VAPI assistant:', errorText)
      return { error: `Failed to create assistant: ${errorText.substring(0, 200)}` }
    }

    const vapiAssistant = await response.json()
    const assistantId = vapiAssistant.id

    // Store assistant in database
    const assistantSettings = {
      model: params.model,
      voiceId: params.voiceId,
      voiceName: params.voiceName,
      firstMessage: params.firstMessage,
      systemPrompt: params.systemPrompt,
      ...params.settings,
    }

    const { data: assistant, error: dbError } = await supabase
      .from('assistants')
      .insert({
        organization_id: params.organizationId,
        name: params.name,
        assistant_id: assistantId,
        type: params.type,
        settings: assistantSettings,
        active: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('[createAssistant] Database error:', dbError)
      // Attempt to delete the VAPI assistant if database insert fails
      try {
        await fetch(`${VAPI_API_URL}/assistant/${assistantId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`,
          },
        })
      } catch (deleteError) {
        console.error('[createAssistant] Failed to cleanup VAPI assistant:', deleteError)
      }
      return { error: `Failed to save assistant: ${dbError.message}` }
    }

    // Update agent_configs to link to the new assistant
    if (params.type === 'inbound') {
      await supabase
        .from('agent_configs')
        .upsert({
          organization_id: params.organizationId,
          inbound_agent_id: assistantId,
        }, {
          onConflict: 'organization_id',
        })
    } else {
      await supabase
        .from('agent_configs')
        .upsert({
          organization_id: params.organizationId,
          outbound_agent_id: assistantId,
        }, {
          onConflict: 'organization_id',
        })
    }

    revalidatePath('/app/inbound-ai')
    revalidatePath('/app/outbound-ai')
    revalidatePath('/app/assistants')

    return { success: true, assistant }
  } catch (error: any) {
    console.error('[createAssistant] Error:', error)
    return { error: error.message || 'Failed to create assistant' }
  }
}

export async function getAssistants(organizationId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated', assistants: [] }
  }

  const { data: assistants, error } = await supabase
    .from('assistants')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, assistants: [] }
  }

  return { assistants: assistants || [] }
}

export async function deleteAssistant(assistantId: string, organizationId: string) {
  const supabase = createActionClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { error: 'Not authenticated' }
  }

  // Get assistant to get VAPI assistant ID
  const { data: assistant, error: fetchError } = await supabase
    .from('assistants')
    .select('assistant_id, type')
    .eq('id', assistantId)
    .eq('organization_id', organizationId)
    .single()

  if (fetchError || !assistant) {
    return { error: 'Assistant not found' }
  }

  const vapiApiKey = process.env.VAPI_API_KEY

  // Delete from VAPI if we have an assistant_id
  if (assistant.assistant_id && vapiApiKey) {
    try {
      await fetch(`${VAPI_API_URL}/assistant/${assistant.assistant_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
        },
      })
    } catch (error) {
      console.error('[deleteAssistant] Failed to delete VAPI assistant:', error)
      // Continue with database deletion even if VAPI deletion fails
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('assistants')
    .delete()
    .eq('id', assistantId)
    .eq('organization_id', organizationId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Clear agent_configs reference if this was the active assistant
  if (assistant.type === 'inbound') {
    await supabase
      .from('agent_configs')
      .update({ inbound_agent_id: null })
      .eq('organization_id', organizationId)
      .eq('inbound_agent_id', assistant.assistant_id)
  } else {
    await supabase
      .from('agent_configs')
      .update({ outbound_agent_id: null })
      .eq('organization_id', organizationId)
      .eq('outbound_agent_id', assistant.assistant_id)
  }

  revalidatePath('/app/assistants')
  revalidatePath('/app/inbound-ai')
  revalidatePath('/app/outbound-ai')

  return { success: true }
}

