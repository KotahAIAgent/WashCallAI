import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      return NextResponse.json(
        { error: 'Failed to fetch voices from ElevenLabs' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform ElevenLabs response to our format
    const voices = data.voices?.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.description || `${voice.category || 'Voice'} - ${voice.labels?.gender || ''}`,
      category: voice.category,
      gender: voice.labels?.gender,
      age: voice.labels?.age,
      accent: voice.labels?.accent,
    })) || []

    return NextResponse.json({ voices })
  } catch (error: any) {
    console.error('Error fetching ElevenLabs voices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}

