'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PROMPT_TEMPLATES } from '@/lib/prompts/templates'

interface PromptBuilderProps {
  organizationId: string
  type: 'inbound' | 'outbound'
  onPromptGenerated: (prompt: string) => void
  initialPrompt?: string
}

export function PromptBuilder({
  organizationId,
  type,
  onPromptGenerated,
  initialPrompt = '',
}: PromptBuilderProps) {
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const { toast } = useToast()

  // Filter templates by type
  const availableTemplates = PROMPT_TEMPLATES.filter(t => 
    t.id.includes(type) || t.id.includes('inbound') || t.id.includes('outbound')
  )

  async function handleAutoGenerate() {
    setLoading(true)
    try {
      const response = await fetch('/api/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          type,
          templateId: selectedTemplate || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate prompt')
      }

      const { prompt: generatedPrompt } = await response.json()
      setPrompt(generatedPrompt)
      onPromptGenerated(generatedPrompt)
      
      toast({
        title: 'Prompt Generated',
        description: 'Your prompt has been automatically generated from your business information.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate prompt',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="space-y-2">
        <Label>Prompt Template (Optional)</Label>
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Auto-select based on your business (Recommended)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Auto-select (Recommended)</SelectItem>
            {availableTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} - {template.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose a specific template or let us auto-select the best one for your business
        </p>
      </div>

      {/* Generate Button */}
      <Button
        type="button"
        onClick={handleAutoGenerate}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating Prompt...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Auto-Generate Prompt from Business Info
          </>
        )}
      </Button>

      {/* Generated Prompt */}
      <div className="space-y-2">
        <Label>Generated Prompt</Label>
        <Textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value)
            onPromptGenerated(e.target.value)
          }}
          rows={15}
          placeholder="Click 'Auto-Generate Prompt' to create a prompt using your business information..."
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Review and edit the generated prompt as needed. It will automatically use your business name, services, service areas, and other information from your profile.
        </p>
      </div>
    </div>
  )
}

