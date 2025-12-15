'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CallRecording {
  id: string
  title: string
  description: string
  duration: string
  audioUrl: string
  type: 'inbound' | 'outbound'
  outcome: 'booked' | 'interested' | 'follow-up'
}

const SAMPLE_RECORDINGS: CallRecording[] = [
  {
    id: '1',
    title: 'Inbound Lead - Service Booking',
    description: 'AI handles customer inquiry and books appointment',
    duration: '2:34',
    audioUrl: '/audio/sample-inbound-booking.mp3', // Placeholder - replace with real URLs
    type: 'inbound',
    outcome: 'booked',
  },
  {
    id: '2',
    title: 'Outbound Follow-up - Past Customer',
    description: 'AI re-engages past customer with discount offer',
    duration: '3:12',
    audioUrl: '/audio/sample-outbound-followup.mp3',
    type: 'outbound',
    outcome: 'interested',
  },
  {
    id: '3',
    title: 'Inbound Inquiry - Service Details',
    description: 'AI answers questions and qualifies lead',
    duration: '4:01',
    audioUrl: '/audio/sample-inbound-qualify.mp3',
    type: 'inbound',
    outcome: 'follow-up',
  },
]

export function CallRecordingsShowcase() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({})

  const handlePlay = (recording: CallRecording) => {
    // Stop currently playing audio
    if (playingId && audioElements[playingId]) {
      audioElements[playingId].pause()
      audioElements[playingId].currentTime = 0
    }

    if (playingId === recording.id) {
      // If clicking the same one, stop it
      setPlayingId(null)
      return
    }

    // Create new audio element if needed
    if (!audioElements[recording.id]) {
      const audio = new Audio(recording.audioUrl)
      audio.addEventListener('ended', () => setPlayingId(null))
      setAudioElements(prev => ({ ...prev, [recording.id]: audio }))
      audio.play()
    } else {
      audioElements[recording.id].play()
    }

    setPlayingId(recording.id)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">
          🔥 Real AI Calls That Convert
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Don't just guess. Hear what real prospects sound like — and how easy it is to turn every call into cash.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {SAMPLE_RECORDINGS.map((recording) => (
          <Card key={recording.id} className="relative">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={recording.type === 'inbound' ? 'default' : 'secondary'}>
                        {recording.type === 'inbound' ? 'Inbound' : 'Outbound'}
                      </Badge>
                      <Badge variant="outline">{recording.outcome}</Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{recording.title}</h3>
                    <p className="text-sm text-muted-foreground">{recording.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">{recording.duration}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlay(recording)}
                    className="flex items-center gap-2"
                  >
                    {playingId === recording.id ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Play
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          ⏱️ AI picks up before humans even react • 🌎 Understands every caller without missing a word
        </p>
      </div>
    </div>
  )
}

