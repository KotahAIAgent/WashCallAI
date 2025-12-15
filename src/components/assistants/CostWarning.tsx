'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Info } from 'lucide-react'
import { calculateAssistantCost, calculateAdjustedMinutes, BASE_COST_PER_MINUTE } from '@/lib/assistants/recommended-settings'

interface CostWarningProps {
  model: string
  voiceId?: string
  monthlyMinutes?: number // Optional: organization's monthly minutes limit
}

export function CostWarning({ model, voiceId, monthlyMinutes }: CostWarningProps) {
  const actualCost = calculateAssistantCost(model, voiceId)
  const isMoreExpensive = actualCost > BASE_COST_PER_MINUTE

  if (!isMoreExpensive || !monthlyMinutes) {
    return null
  }

  const adjustedMinutes = calculateAdjustedMinutes(
    monthlyMinutes,
    BASE_COST_PER_MINUTE,
    actualCost
  )

  const costIncreasePercent = ((actualCost / BASE_COST_PER_MINUTE - 1) * 100).toFixed(0)
  const minutesReduction = monthlyMinutes - adjustedMinutes

  return (
    <Alert variant="warning" className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">Higher Cost Per Minute</AlertTitle>
      <AlertDescription className="text-amber-800 space-y-2 mt-2">
        <p>
          This configuration costs <strong>${actualCost.toFixed(2)}/min</strong> ({costIncreasePercent}% more than recommended).
        </p>
        {monthlyMinutes > 0 && (
          <div className="space-y-1">
            <p>
              Your monthly minutes will be adjusted from <strong>{monthlyMinutes.toLocaleString()}</strong> to{' '}
              <strong>{adjustedMinutes.toLocaleString()}</strong> minutes ({minutesReduction.toLocaleString()} fewer minutes).
            </p>
            <p className="text-xs flex items-center gap-1">
              <Info className="h-3 w-3" />
              This ensures your monthly budget stays the same despite the higher per-minute cost.
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

