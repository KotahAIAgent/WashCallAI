'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number // -1.0 to 1.0
  confidence: number // 0.0 to 1.0
  reasoning?: string
}

/**
 * Analyze sentiment of a call transcript
 */
export async function analyzeCallSentiment(
  transcript: string
): Promise<SentimentResult | null> {
  if (!process.env.OPENAI_API_KEY || !transcript || transcript.trim().length < 50) {
    return null
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the sentiment of customer service calls and return a JSON object with:
- sentiment: "positive", "neutral", or "negative"
- score: A number between -1.0 (very negative) and 1.0 (very positive)
- confidence: A number between 0.0 and 1.0 indicating your confidence
- reasoning: A brief explanation of why this sentiment was determined

Focus on the customer's tone, satisfaction level, and overall sentiment throughout the conversation.`,
        },
        {
          role: 'user',
          content: `Analyze the sentiment of this call transcript:\n\n${transcript.substring(0, 4000)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const result = JSON.parse(content) as SentimentResult
    return result
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return null
  }
}

