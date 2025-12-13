'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Volume2, Loader2, AlertCircle } from 'lucide-react'
import { updateVoiceSettings } from '@/lib/agents/actions'
import { useToast } from '@/hooks/use-toast'

interface ElevenLabsVoice {
  id: string
  name: string
  description: string
  category?: string
  gender?: string
  age?: string
  accent?: string
}

interface VoiceSelectorProps {
  organizationId: string
  agentType: 'inbound' | 'outbound'
  currentVoiceId?: string | null
  currentVoiceName?: string | null
}

export function VoiceSelector({ organizationId, agentType, currentVoiceId, currentVoiceName }: VoiceSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [voicesLoading, setVoicesLoading] = useState(true)
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState(currentVoiceId || '')
  const { toast } = useToast()

  // Fetch voices from ElevenLabs API
  useEffect(() => {
    async function fetchVoices() {
      try {
        const response = await fetch('/api/elevenlabs/voices')
        if (response.ok) {
          const data = await response.json()
          setVoices(data.voices || [])
        } else {
          const error = await response.json()
          console.error('Failed to fetch voices:', error)
          toast({
            title: 'Warning',
            description: 'Could not load voices from ElevenLabs. Using default voices.',
            variant: 'destructive',
          })
          // Fallback to empty array - you could add default voices here if needed
        }
      } catch (error) {
        console.error('Error fetching voices:', error)
        toast({
          title: 'Error',
          description: 'Failed to load voices. Please refresh the page.',
          variant: 'destructive',
        })
      } finally {
        setVoicesLoading(false)
      }
    }

    fetchVoices()
  }, [toast])

  const handleVoiceChange = async (voiceId: string) => {
    console.log(`[VoiceSelector] 🎤 Voice change triggered:`, {
      organizationId,
      agentType,
      voiceId,
      currentVoiceId,
      timestamp: new Date().toISOString(),
    })

    setSelectedVoiceId(voiceId)
    const selectedVoice = voices.find(v => v.id === voiceId)
    
    console.log(`[VoiceSelector] Selected voice:`, selectedVoice)
    
    setLoading(true)
    
    try {
      console.log(`[VoiceSelector] Calling updateVoiceSettings...`)
      const result = await updateVoiceSettings(organizationId, agentType, voiceId, selectedVoice?.name || '')
      console.log(`[VoiceSelector] updateVoiceSettings result:`, result)
      
      if (result?.error) {
        console.error(`[VoiceSelector] ❌ Error from updateVoiceSettings:`, result.error)
        toast({
          title: result.warning ? 'Warning' : 'Error',
          description: result.error,
          variant: result.warning ? 'default' : 'destructive',
        })
        // Only revert if it's a real error, not a warning
        if (!result.warning) {
          setSelectedVoiceId(currentVoiceId || '') // Revert on error
        }
      } else {
        console.log(`[VoiceSelector] ✅ Voice update successful`)
        toast({
          title: 'Voice updated',
          description: `Your ${agentType} agent will now use ${selectedVoice?.name || 'the selected voice'}.`,
        })
      }
    } catch (error: any) {
      console.error(`[VoiceSelector] ❌ Exception in handleVoiceChange:`, error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update voice',
        variant: 'destructive',
      })
      setSelectedVoiceId(currentVoiceId || '') // Revert on error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Selection
        </CardTitle>
        <CardDescription>
          Choose a voice from your ElevenLabs library for your {agentType} AI agent. Changes apply automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Voice</Label>
            {voicesLoading ? (
              <div className="flex items-center gap-2 p-4 border rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading voices from ElevenLabs...</span>
              </div>
            ) : voices.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-900">No voices found. Make sure ELEVENLABS_API_KEY is configured.</span>
              </div>
            ) : (
              <Select 
                value={selectedVoiceId} 
                onValueChange={handleVoiceChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a voice..." />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{voice.name}</span>
                        {voice.description && (
                          <span className="text-xs text-muted-foreground ml-4">
                            {voice.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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

