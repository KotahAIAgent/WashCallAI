'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Zap, Volume2, PhoneOff, MessageSquare } from 'lucide-react'

interface AdvancedDialingSettingsProps {
  dialingMode?: 'sequential' | 'parallel' | 'power' | 'preview'
  parallelDialCount?: number
  answeringMachineDetection?: boolean
  voicemailDropEnabled?: boolean
  voicemailDropMessage?: string
  onDialingModeChange: (mode: 'sequential' | 'parallel' | 'power' | 'preview') => void
  onParallelDialCountChange: (count: number) => void
  onAnsweringMachineDetectionChange: (enabled: boolean) => void
  onVoicemailDropEnabledChange: (enabled: boolean) => void
  onVoicemailDropMessageChange: (message: string) => void
}

export function AdvancedDialingSettings({
  dialingMode = 'sequential',
  parallelDialCount = 1,
  answeringMachineDetection = true,
  voicemailDropEnabled = false,
  voicemailDropMessage = '',
  onDialingModeChange,
  onParallelDialCountChange,
  onAnsweringMachineDetectionChange,
  onVoicemailDropEnabledChange,
  onVoicemailDropMessageChange,
}: AdvancedDialingSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Advanced Dialing Settings
        </CardTitle>
        <CardDescription>
          Optimize your outbound calling with advanced dialing modes and features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dialing Mode */}
        <div className="space-y-3">
          <Label>Dialing Mode</Label>
          <Select value={dialingMode} onValueChange={(v: any) => onDialingModeChange(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sequential">
                Sequential - One call at a time
              </SelectItem>
              <SelectItem value="parallel">
                Parallel - Multiple lines simultaneously (Premium)
              </SelectItem>
              <SelectItem value="power">
                Power - Auto-dial with adjustable pacing
              </SelectItem>
              <SelectItem value="preview">
                Preview - Review contact before dialing
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {dialingMode === 'sequential' && 'Standard one-call-at-a-time dialing'}
            {dialingMode === 'parallel' && 'Dial up to 10 lines at once, connect to first answer'}
            {dialingMode === 'power' && 'Automatically dials next contact with configurable pacing'}
            {dialingMode === 'preview' && 'Review contact details before each call'}
          </p>
        </div>

        {/* Parallel Dial Count */}
        {dialingMode === 'parallel' && (
          <div className="space-y-2">
            <Label htmlFor="parallelDialCount">Parallel Lines (1-10)</Label>
            <Input
              id="parallelDialCount"
              type="number"
              min={1}
              max={10}
              value={parallelDialCount}
              onChange={(e) => onParallelDialCountChange(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Number of lines to dial simultaneously. Higher numbers increase talk time but use more minutes.
            </p>
          </div>
        )}

        {/* Answering Machine Detection */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="amd" className="flex items-center gap-2">
              <PhoneOff className="h-4 w-4" />
              Answering Machine Detection
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically detect voicemails and skip unanswered calls
            </p>
          </div>
          <Switch
            id="amd"
            checked={answeringMachineDetection}
            onCheckedChange={onAnsweringMachineDetectionChange}
          />
        </div>

        {/* Voicemail Drop */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="vmDrop" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Voicemail Drop
              </Label>
              <p className="text-sm text-muted-foreground">
                Drop a pre-recorded message when voicemail is detected
              </p>
            </div>
            <Switch
              id="vmDrop"
              checked={voicemailDropEnabled}
              onCheckedChange={onVoicemailDropEnabledChange}
            />
          </div>

          {voicemailDropEnabled && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label htmlFor="vmMessage">Voicemail Message URL</Label>
              <Input
                id="vmMessage"
                type="url"
                placeholder="https://example.com/voicemail-message.mp3"
                value={voicemailDropMessage}
                onChange={(e) => onVoicemailDropMessageChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL to a pre-recorded audio file. Should be publicly accessible.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

