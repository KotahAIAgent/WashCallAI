import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface CallContext {
  direction: 'inbound' | 'outbound'
  callStatus: 'completed' | 'answered' | 'voicemail' | 'failed'
  leadStatus: 'interested' | 'not_interested' | 'callback' | 'new'
  clientName?: string | null
  clientPhone: string
  companyName: string
  serviceType?: string | null
  address?: string | null
  transcript?: string | null
  summary?: string | null
  industry?: string | null
  servicesOffered?: string[] | null
}

/**
 * Generate Hormozi-style SMS message using AI
 * Principles: Value-first, urgency, risk reversal, specific outcomes, can't-say-no
 */
export async function generateHormoziSMS(context: CallContext): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  if (!process.env.OPENAI_API_KEY) {
    return { success: false, error: 'OpenAI API key not configured' }
  }

  try {
    // Determine message strategy based on call outcome
    const strategy = determineMessageStrategy(context)
    
    const systemPrompt = `You are an expert copywriter specializing in Alex Hormozi's value-first messaging framework. Your job is to write SMS messages that are so compelling, prospects literally cannot say no.

CRITICAL RULES:
1. NEVER use dashes or hyphens anywhere in the message
2. Focus on VALUE and OUTCOMES, not features
3. Create urgency without being pushy
4. Use specific numbers, results, or transformations
5. Personalize using the client's name and context
6. Make it conversational and direct
7. Include risk reversal or guarantee language
8. Keep it under 160 characters when possible, max 320
9. Use active voice and power words
10. End with a clear call to action

Message style: Direct, confident, value-driven, outcome-focused.`

    const userPrompt = buildHormoziPrompt(context, strategy)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast and cost-effective
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8, // Creative but focused
      max_tokens: 200,
    })

    let message = response.choices[0]?.message?.content?.trim() || ''
    
    // Remove any dashes/hyphens that might have slipped through
    message = message.replace(/[-–—]/g, ' ')
    // Clean up double spaces
    message = message.replace(/\s+/g, ' ').trim()

    if (!message) {
      return { success: false, error: 'Failed to generate message' }
    }

    return { success: true, message }
  } catch (error: any) {
    console.error('Error generating Hormozi SMS:', error)
    return { success: false, error: error?.message || 'Failed to generate message' }
  }
}

function determineMessageStrategy(context: CallContext): string {
  const { direction, callStatus, leadStatus } = context

  // Successful inbound call
  if (direction === 'inbound' && (callStatus === 'completed' || callStatus === 'answered')) {
    if (leadStatus === 'interested') {
      return 'inbound_interested'
    }
    return 'inbound_confirmation'
  }

  // Successful outbound call
  if (direction === 'outbound' && (callStatus === 'completed' || callStatus === 'answered')) {
    if (leadStatus === 'interested') {
      return 'outbound_interested'
    }
    if (leadStatus === 'callback') {
      return 'outbound_callback'
    }
    return 'outbound_followup'
  }

  // Voicemail
  if (callStatus === 'voicemail') {
    return 'voicemail_followup'
  }

  // Unsuccessful / Not interested
  if (leadStatus === 'not_interested' || callStatus === 'failed') {
    return 'unsuccessful_recovery'
  }

  // Default
  return 'general_followup'
}

function buildHormoziPrompt(context: CallContext, strategy: string): string {
  const {
    clientName,
    companyName,
    serviceType,
    address,
    transcript,
    summary,
    industry,
    servicesOffered,
  } = context

  const name = clientName || 'there'
  const service = serviceType || 'our services'
  const location = address ? ` at ${address}` : ''

  let basePrompt = `Write a Hormozi-style SMS message for ${name} from ${companyName}.`

  switch (strategy) {
    case 'inbound_interested':
      return `${basePrompt}

Context: ${name} just called ${companyName} and expressed interest in ${service}${location}.

Goal: Confirm the conversation, recap key details, and create excitement about next steps. Make them feel valued and build anticipation.

Include: Specific service mentioned, address if provided, next steps, and why working with ${companyName} is the right choice.

${summary ? `Call summary: ${summary}` : ''}
${transcript ? `Key points from conversation: ${transcript.substring(0, 500)}` : ''}`

    case 'inbound_confirmation':
      return `${basePrompt}

Context: ${name} called ${companyName} about ${service}${location}.

Goal: Thank them, confirm we captured their information correctly, and create value by showing we're organized and ready to help.

Include: Gratitude, confirmation of details, what happens next, and why ${companyName} delivers results.

${summary ? `Call summary: ${summary}` : ''}`

    case 'outbound_interested':
      return `${basePrompt}

Context: ${companyName} just called ${name} about ${service}${location}. ${name} showed interest and wants to move forward.

Goal: Create massive excitement about working together. Show the transformation/value they'll get. Make them feel like they made the best decision.

Include: Enthusiasm about partnership, specific value/outcomes they'll receive, next steps, and social proof if relevant.

${summary ? `Call summary: ${summary}` : ''}
${servicesOffered ? `Services offered: ${servicesOffered.join(', ')}` : ''}`

    case 'outbound_callback':
      return `${basePrompt}

Context: ${companyName} called ${name} about ${service}. ${name} requested a callback.

Goal: Acknowledge their request, create value by showing we're responsive, and build anticipation for the conversation.

Include: Confirmation we'll call back, why the conversation will be valuable, and a timeframe.

${summary ? `Call summary: ${summary}` : ''}`

    case 'voicemail_followup':
      return `${basePrompt}

Context: ${companyName} tried calling ${name} about ${service}${location} but got voicemail.

Goal: Create urgency and value so they WANT to call back. Make it irresistible.

Include: Why they should call back NOW, specific value/offer, urgency without being pushy, and easy way to respond.

${servicesOffered ? `Services: ${servicesOffered.join(', ')}` : ''}
${industry ? `Industry: ${industry}` : ''}`

    case 'unsuccessful_recovery':
      return `${basePrompt}

Context: ${companyName} called ${name} about ${service}${location}, but ${name} wasn't interested or the call didn't go well.

Goal: Turn this around with an irresistible offer they literally cannot refuse. Use value stacking, risk reversal, and urgency.

Include: A compelling offer/guarantee, specific transformation/outcome, risk reversal (money-back, guarantee, etc.), urgency, and why this is different.

${summary ? `What happened: ${summary}` : ''}
${servicesOffered ? `Services: ${servicesOffered.join(', ')}` : ''}
${industry ? `Industry: ${industry}` : ''}`

    default:
      return `${basePrompt}

Context: ${companyName} had a conversation with ${name} about ${service}${location}.

Goal: Follow up with value and next steps. Make them excited to continue the conversation.

${summary ? `Call summary: ${summary}` : ''}`
  }
}

