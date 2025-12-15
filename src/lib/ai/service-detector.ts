import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ServiceDetectionResult {
  serviceType: string
  confidence: number
  detectedServices: string[]
  extractedDetails: {
    propertyType?: 'residential' | 'commercial' | 'unknown'
    urgency?: 'high' | 'medium' | 'low'
    budget?: string
    timeline?: string
    location?: string
  }
}

/**
 * Detects service type from form submission text
 * Uses AI to analyze free-form text and extract service information
 */
export async function detectServiceFromForm(
  formText: string,
  specifiedServiceType?: string
): Promise<ServiceDetectionResult> {
  // If service type is explicitly specified, use it
  if (specifiedServiceType && specifiedServiceType.trim()) {
    return {
      serviceType: specifiedServiceType.trim(),
      confidence: 1.0,
      detectedServices: [specifiedServiceType.trim()],
      extractedDetails: {},
    }
  }

  // Use AI to detect service type from text
  try {
    const prompt = `Analyze the following customer inquiry and determine what service they need. 

Text: "${formText}"

Respond with a JSON object containing:
- serviceType: The primary service requested (e.g., "House Washing", "Driveway Cleaning", "Roof Cleaning", "Commercial Pressure Washing", "Deck Staining")
- detectedServices: Array of all services mentioned
- propertyType: "residential", "commercial", or "unknown"
- urgency: "high", "medium", or "low" based on language cues
- budget: Any budget mentioned
- timeline: Any timeline mentioned
- location: Any location details mentioned

If unclear, infer from context. For pressure washing businesses, common services include: House Washing, Driveway Cleaning, Deck Cleaning, Fence Cleaning, Roof Cleaning, Commercial Building Washing, Parking Lot Cleaning, etc.

Return ONLY valid JSON, no markdown or additional text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing customer inquiries for service businesses. Extract structured information from customer requests.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())

    return {
      serviceType: parsed.serviceType || 'General Service',
      confidence: 0.8,
      detectedServices: parsed.detectedServices || [parsed.serviceType] || ['General Service'],
      extractedDetails: {
        propertyType: parsed.propertyType || 'unknown',
        urgency: parsed.urgency || 'medium',
        budget: parsed.budget,
        timeline: parsed.timeline,
        location: parsed.location,
      },
    }
  } catch (error) {
    console.error('Error detecting service from form:', error)
    
    // Fallback: Try to extract common service keywords
    const lowerText = formText.toLowerCase()
    const serviceKeywords: Record<string, string> = {
      'house wash': 'House Washing',
      'house cleaning': 'House Washing',
      'driveway': 'Driveway Cleaning',
      'deck': 'Deck Cleaning',
      'fence': 'Fence Cleaning',
      'roof': 'Roof Cleaning',
      'commercial': 'Commercial Pressure Washing',
      'parking lot': 'Parking Lot Cleaning',
      'building wash': 'Commercial Building Washing',
      'soft wash': 'Soft Washing',
      'pressure wash': 'Pressure Washing',
    }

    for (const [keyword, service] of Object.entries(serviceKeywords)) {
      if (lowerText.includes(keyword)) {
        return {
          serviceType: service,
          confidence: 0.6,
          detectedServices: [service],
          extractedDetails: {},
        }
      }
    }

    // Ultimate fallback
    return {
      serviceType: 'General Service',
      confidence: 0.3,
      detectedServices: ['General Service'],
      extractedDetails: {},
    }
  }
}

/**
 * Normalizes service type to match database conventions
 */
export function normalizeServiceType(serviceType: string): string {
  return serviceType.trim()
}

