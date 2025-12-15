'use server'

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface Topic {
  topic: string
  relevance: number // 0.0 to 1.0
  category?: string
}

/**
 * Extract key topics from a call transcript
 */
export async function extractCallTopics(
  transcript: string,
  maxTopics: number = 5
): Promise<Topic[]> {
  if (!process.env.OPENAI_API_KEY || !transcript || transcript.trim().length < 50) {
    return []
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a topic extraction expert. Analyze customer service calls and extract the most important topics discussed. Return a JSON array of topics with:
- topic: A short, descriptive topic name (2-5 words)
- relevance: A number between 0.0 and 1.0 indicating importance
- category: Optional category (e.g., "pricing", "features", "support", "billing", "technical")

Extract ${maxTopics} most relevant topics. Focus on actionable items, concerns, questions, or key points raised.`,
        },
        {
          role: 'user',
          content: `Extract topics from this call transcript:\n\n${transcript.substring(0, 4000)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    const result = JSON.parse(content)
    const topics = result.topics || result.topics_array || []
    
    // Sort by relevance and limit
    return (Array.isArray(topics) ? topics : [])
      .sort((a: Topic, b: Topic) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, maxTopics)
  } catch (error) {
    console.error('Topic extraction error:', error)
    return []
  }
}

