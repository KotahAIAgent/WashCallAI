'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStepProps {
  title: string
  description: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isFirst: boolean
  isLast: boolean
}

export function TourStep({
  title,
  description,
  targetSelector,
  position = 'bottom',
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  isFirst,
  isLast,
}: TourStepProps) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({})
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!targetSelector) {
      // Center the card for welcome/general steps
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      })
      setSpotlightStyle({})
      return
    }

    const target = document.querySelector(targetSelector)
    if (!target) {
      // Fallback to center if target not found
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      })
      setSpotlightStyle({})
      return
    }

    const rect = target.getBoundingClientRect()
    const padding = 8

    // Set spotlight position
    setSpotlightStyle({
      position: 'fixed',
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      zIndex: 9999,
    })

    // Calculate tooltip position based on specified position
    const tooltipWidth = 320
    const tooltipHeight = 200
    const gap = 12

    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10001,
      maxWidth: '90vw',
    }

    switch (position) {
      case 'top':
        style.top = rect.top - tooltipHeight - gap
        style.left = Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2)
        break
      case 'bottom':
        style.top = rect.bottom + gap
        style.left = Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2)
        break
      case 'left':
        style.top = rect.top + rect.height / 2 - tooltipHeight / 2
        style.left = rect.left - tooltipWidth - gap
        break
      case 'right':
        style.top = rect.top + rect.height / 2 - tooltipHeight / 2
        style.left = rect.right + gap
        break
    }

    // Ensure tooltip stays within viewport
    if (typeof style.left === 'number' && style.left < 16) style.left = 16
    if (typeof style.top === 'number' && style.top < 16) style.top = 16

    setTooltipStyle(style)
  }, [targetSelector, position])

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300"
        onClick={onSkip}
      />

      {/* Spotlight cutout */}
      {targetSelector && spotlightStyle.top !== undefined && (
        <div
          className="rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] bg-transparent pointer-events-none transition-all duration-300"
          style={spotlightStyle}
        />
      )}

      {/* Tooltip Card */}
      <Card 
        ref={cardRef}
        className={cn(
          "w-80 shadow-2xl border-primary/20 animate-in fade-in-0 zoom-in-95 duration-300",
          !targetSelector && "max-w-md"
        )}
        style={tooltipStyle}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mr-2 -mt-2"
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentStep 
                    ? "w-4 bg-primary" 
                    : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={onPrev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={onNext}>
              {isLast ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}

