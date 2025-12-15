'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createAssistant } from '@/lib/assistants/actions'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Bot } from 'lucide-react'

interface ElevenLabsVoice {
  id: string
  name: string
  description: string
}

interface CreateAssistantDialogProps {
  organizationId: string
  type: 'inbound' | 'outbound'
  onSuccess?: () => void
}

export function CreateAssistantDialog({ organizationId, type, onSuccess }: CreateAssistantDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [voicesLoading, setVoicesLoading] = useState(true)
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [formData, setFormData] = useState({
    name: '',
    model: 'gpt-3.5-turbo',
    voiceId: '',
    firstMessage: '',
    systemPrompt: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    async function fetchVoices() {
      try {
        const response = await fetch('/api/elevenlabs/voices')
        if (response.ok) {
          const data = await response.json()
          setVoices(data.voices || [])
          if (data.voices && data.voices.length > 0) {
            setFormData(prev => ({ ...prev, voiceId: data.voices[0].id }))
          }
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error)
      } finally {
        setVoicesLoading(false)
      }
    }

    if (open) {
      fetchVoices()
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const selectedVoice = voices.find(v => v.id === formData.voiceId)

    const result = await createAssistant({
      organizationId,
      name: formData.name,
      type,
      model: formData.model,
      voiceId: formData.voiceId,
      voiceName: selectedVoice?.name,
      firstMessage: formData.firstMessage || undefined,
      systemPrompt: formData.systemPrompt || undefined,
    })

    if (result?.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Success',
        description: `${type === 'inbound' ? 'Inbound' : 'Outbound'} assistant created successfully`,
      })
      setOpen(false)
      setFormData({
        name: '',
        model: 'gpt-3.5-turbo',
        voiceId: '',
        firstMessage: '',
        systemPrompt: '',
      })
      if (onSuccess) {
        onSuccess()
      }
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create {type === 'inbound' ? 'Inbound' : 'Outbound'} Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create {type === 'inbound' ? 'Inbound' : 'Outbound'} Assistant
          </DialogTitle>
          <DialogDescription>
            Create a new AI assistant for {type === 'inbound' ? 'incoming' : 'outbound'} calls with custom settings
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Assistant Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Main Receptionist, Sales Assistant"
              required
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this assistant
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select value={formData.model} onValueChange={(v) => setFormData(prev => ({ ...prev, model: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast, Cost-effective)</SelectItem>
                <SelectItem value="gpt-4">GPT-4 (More accurate, Slower)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Best balance)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the AI model for your assistant
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voiceId">Voice</Label>
            {voicesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading voices...
              </div>
            ) : (
              <Select value={formData.voiceId} onValueChange={(v) => setFormData(prev => ({ ...prev, voiceId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name} {voice.description ? `- ${voice.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Choose the voice for your assistant
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstMessage">First Message</Label>
            <Input
              id="firstMessage"
              value={formData.firstMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, firstMessage: e.target.value }))}
              placeholder="e.g., Hello! Thank you for calling. How can I help you today?"
            />
            <p className="text-xs text-muted-foreground">
              The first thing your assistant says when answering a call
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
              placeholder="e.g., You are a friendly and professional AI assistant for a service business. Your goal is to help customers, answer questions, and schedule appointments."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Customize how your assistant behaves and responds
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Assistant'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

