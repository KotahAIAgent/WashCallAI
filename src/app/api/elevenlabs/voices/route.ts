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
    
    // Log all voices for debugging
    console.log(`[ElevenLabs API] Total voices returned: ${data.voices?.length || 0}`)
    
    // Transform ElevenLabs response to our format
    // Filter to only show custom voices (exclude premade/default voices)
    const allVoices = data.voices?.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.description || `${voice.category || 'Voice'} - ${voice.labels?.gender || ''}`,
      category: voice.category,
      gender: voice.labels?.gender,
      age: voice.labels?.age,
      accent: voice.labels?.accent,
      // Keep original data for filtering
      _original: voice,
    })) || []
    
    // Filter to only custom voices
    // Custom voices are typically those that:
    // 1. Don't have category "premade" or similar
    // 2. Are not in the default/premade collection
    // 3. Have been created by the user
    const customVoices = allVoices.filter((voice: any) => {
      const original = voice._original
      
      // Log voice properties for debugging (first few voices only)
      if (allVoices.indexOf(voice) < 3) {
        console.log(`[ElevenLabs API] Voice sample: ${voice.name}`, {
          category: original.category,
          type: original.type,
          labels: original.labels,
          settings: original.settings,
          use_case: original.use_case,
          voice_id: original.voice_id,
        })
      }
      
      // Check various indicators of premade voices
      // Be conservative - only filter out voices that are clearly marked as premade
      const isPremade = 
        original.category === 'premade' ||
        original.category === 'default' ||
        original.category === 'premade-voice' ||
        original.type === 'premade' ||
        original.type === 'default' ||
        (original.labels && original.labels.premade === true) ||
        // Check if voice name explicitly indicates premade
        original.name?.toLowerCase().includes('(premade)') ||
        original.name?.toLowerCase().includes('(default)')
      
      // Log for debugging (first 5 voices to see structure)
      if (allVoices.indexOf(voice) < 5) {
        console.log(`[ElevenLabs API] Voice: ${voice.name}`, {
          category: original.category,
          type: original.type,
          isPremade,
          hasSettings: !!original.settings,
          hasUseCase: !!original.use_case,
          hasCreatedAt: !!original.created_at,
        })
      }
      
      // Log premade voices being filtered
      if (isPremade) {
        console.log(`[ElevenLabs API] Filtering out premade voice: ${voice.name} (category: ${original.category}, type: ${original.type})`)
      }
      
      // Return true if it's NOT premade (i.e., it's a custom voice)
      return !isPremade
    })
    
    // Remove the _original property before returning
    const voices = customVoices.map(({ _original, ...voice }) => voice)
    
    console.log(`[ElevenLabs API] Custom voices after filtering: ${voices.length}`)
    
    return NextResponse.json({ voices })
  } catch (error: any) {
    console.error('Error fetching ElevenLabs voices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}

