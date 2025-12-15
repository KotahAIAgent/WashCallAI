'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface AINote {
  summary: string
  actionItems: string[]
  keyPoints: string[]
  nextSteps?: string[]
  tags?: string[]
}

/**
 * Generate structured AI notes from a call transcript
 */
export async function generateAINotes(
  transcript: string,
  summary?: string
): Promise<AINote | null> {
  if (!process.env.OPENAI_API_KEY || !transcript || transcript.trim().length < 50) {
    return null
  }

  try {
    const inputText = summary 
      ? `Summary: ${summary}\n\nTranscript: ${transcript.substring(0, 3000)}`
      : transcript.substring(0, 4000)

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a professional note-taking assistant. Generate structured notes from customer service calls. Return a JSON object with:
- summary: A brief 2-3 sentence summary of the call
- actionItems: Array of specific action items that need to be addressed (e.g., "Follow up on pricing quote", "Send product documentation")
- keyPoints: Array of key discussion points (e.g., "Customer interested in premium package", "Budget of $5000/month")
- nextSteps: Optional array of recommended next steps
- tags: Optional array of relevant tags (e.g., "interested", "pricing", "technical", "urgent")

Be concise, specific, and actionable.`,
        },
        {
          role: 'user',
          content: `Generate structured notes from this call:\n\n${inputText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const result = JSON.parse(content) as AINote
    return result
  } catch (error) {
    console.error('AI notes generation error:', error)
    return null
  }
}

