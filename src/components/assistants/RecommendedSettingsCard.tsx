'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Zap } from 'lucide-react'
import { 
  getRecommendedInboundSettings, 
  getRecommendedOutboundSettings,
  type RecommendedSettings 
} from '@/lib/assistants/recommended-settings'

interface RecommendedSettingsCardProps {
  type: 'inbound' | 'outbound'
  onApply: (settings: RecommendedSettings) => void
}

export function RecommendedSettingsCard({ type, onApply }: RecommendedSettingsCardProps) {
  const recommended = type === 'inbound' 
    ? getRecommendedInboundSettings() 
    : getRecommendedOutboundSettings()

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Recommended Settings
            </CardTitle>
            <CardDescription className="mt-1">
              Optimized for cost and performance (${recommended.costPerMinute.toFixed(2)}/min)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-medium">Model:</span>
            <span className="text-muted-foreground">{recommended.model}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-medium">Voice:</span>
            <span className="text-muted-foreground">{recommended.voiceName}</span>
          </div>
          {recommended.firstMessage && (
            <div className="flex items-start gap-2 pt-1">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <span className="font-medium">First Message: </span>
                <span className="text-muted-foreground italic">&quot;{recommended.firstMessage}&quot;</span>
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={() => onApply(recommended)}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Apply Recommended Settings
        </Button>
      </CardContent>
    </Card>
  )
}

