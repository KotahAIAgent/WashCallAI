'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Loader2 } from 'lucide-react'
import { updateVoiceSettings } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'

// ElevenLabs voice options - you can expand this list
const ELEVENLABS_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', description: 'Professional, warm' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', description: 'Strong, confident' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', description: 'Soft, friendly' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', description: 'Deep, professional' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', description: 'Young, energetic' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', description: 'Casual, friendly' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', description: 'Strong, authoritative' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', description: 'Calm, reassuring' },
  { id: 'yoZ06aMxZJJ28mfd3POZ', name: 'Sam', gender: 'male', description: 'Professional, clear' },
]

interface VoiceSelectorProps {
  organizationId: string
  agentType: 'inbound' | 'outbound'
  currentVoiceId?: string | null
  currentVoiceName?: string | null
}

export function VoiceSelector({ organizationId, agentType, currentVoiceId, currentVoiceName }: VoiceSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [selectedVoiceId, setSelectedVoiceId] = useState(currentVoiceId || '')
  const { toast } = useToast()

  const handleVoiceChange = async (voiceId: string) => {
    setSelectedVoiceId(voiceId)
    const selectedVoice = ELEVENLABS_VOICES.find(v => v.id === voiceId)
    
    setLoading(true)
    const result = await updateVoiceSettings(organizationId, agentType, voiceId, selectedVoice?.name || '')
    
    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setSelectedVoiceId(currentVoiceId || '') // Revert on error
    } else {
      toast({
        title: 'Voice updated',
        description: `Your ${agentType} agent will now use ${selectedVoice?.name || 'the selected voice'}.`,
      })
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Selection
        </CardTitle>
        <CardDescription>
          Choose the voice for your {agentType} AI agent. Changes apply automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Voice</Label>
            <Select 
              value={selectedVoiceId} 
              onValueChange={handleVoiceChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a voice..." />
              </SelectTrigger>
              <SelectContent>
                {ELEVENLABS_VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{voice.name}</span>
                      <span className="text-xs text-muted-foreground ml-4">
                        {voice.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {currentVoiceName && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">
                <span className="font-medium">Current voice:</span> {currentVoiceName}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

