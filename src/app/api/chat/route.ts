import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { codebase_search } from '@/lib/search/codebase-search'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Search codebase for relevant information
    let codebaseContext = ''
    try {
      // Use semantic search to find relevant code/documentation
      const searchResults = await codebase_search({
        query: message,
        maxResults: 5,
      })
      
      if (searchResults && searchResults.length > 0) {
        codebaseContext = searchResults
          .map((result: any) => {
            const file = result.file || result.path || ''
            const content = result.content || result.text || ''
            return `File: ${file}\n${content.substring(0, 500)}`
          })
          .join('\n\n---\n\n')
      }
    } catch (error) {
      console.error('Codebase search error:', error)
      // Continue without codebase context if search fails
    }

    // Build system prompt
    const systemPrompt = `You are a helpful assistant for FusionCaller, an AI-powered phone calling platform. 
Your job is to answer questions about how to use the platform, its features, and help users understand the system.

${codebaseContext ? `Here is relevant information from the codebase that may help answer the question:\n\n${codebaseContext}\n\n` : ''}

Use the codebase information when it's relevant and accurate. If the codebase doesn't have the answer, use your general knowledge about AI phone systems, customer service platforms, and similar tools to provide helpful guidance.

Be concise, friendly, and helpful. If you're not sure about something specific to FusionCaller, acknowledge that and suggest they contact support.`

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.'

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

