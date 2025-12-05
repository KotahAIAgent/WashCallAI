'use client'

import { useState } from 'react'
import { Clock, Sparkles, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface TrialBannerProps {
  daysRemaining: number
  trialEndsAt: string
}

export function TrialBanner({ daysRemaining, trialEndsAt }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const totalDays = 15
  const daysUsed = totalDays - daysRemaining
  const progressPercent = (daysUsed / totalDays) * 100

  const getUrgencyColor = () => {
    if (daysRemaining <= 3) return 'bg-red-500'
    if (daysRemaining <= 7) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getUrgencyBgColor = () => {
    if (daysRemaining <= 3) return 'from-red-500/10 to-red-500/5 border-red-200 dark:border-red-800'
    if (daysRemaining <= 7) return 'from-yellow-500/10 to-yellow-500/5 border-yellow-200 dark:border-yellow-800'
    return 'from-primary/10 to-primary/5 border-primary/20'
  }

  const formattedEndDate = new Date(trialEndsAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className={`relative mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border bg-gradient-to-r ${getUrgencyBgColor()}`}>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between pr-6">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-full ${getUrgencyColor()} text-white flex-shrink-0`}>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <h3 className="font-semibold text-sm sm:text-base">
                {daysRemaining <= 3 ? '⚠️ Trial Ending Soon!' : '🎉 Free Trial Active'}
              </h3>
              <span className={`text-xs sm:text-sm font-bold ${daysRemaining <= 3 ? 'text-red-600' : daysRemaining <= 7 ? 'text-yellow-600' : 'text-primary'}`}>
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {daysRemaining <= 3 
                ? `Your trial ends on ${formattedEndDate}. Upgrade now!`
                : `Full access until ${formattedEndDate}.`
              }
            </p>
            
            {/* Progress bar */}
            <div className="mt-2 w-32 sm:w-48">
              <Progress value={progressPercent} className={`h-1 sm:h-1.5 [&>div]:${getUrgencyColor()}`} />
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Day {daysUsed} of {totalDays}
              </p>
            </div>
          </div>
        </div>

        <Link href="/app/pricing" className="flex-shrink-0">
          <Button size="sm" className={`w-full sm:w-auto ${daysRemaining <= 3 ? 'bg-red-600 hover:bg-red-700' : ''}`}>
            <Sparkles className="h-4 w-4 mr-2" />
            {daysRemaining <= 3 ? 'Upgrade Now' : 'View Plans'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

