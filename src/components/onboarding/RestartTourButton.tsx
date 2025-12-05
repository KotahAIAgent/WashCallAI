'use client'

import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useTourContext } from './OnboardingTour'
import { useRouter } from 'next/navigation'

export function RestartTourButton() {
  const { resetTour, startTour } = useTourContext()
  const router = useRouter()

  const handleRestartTour = () => {
    resetTour()
    // Navigate to dashboard first
    router.push('/app/dashboard')
    // Small delay to ensure navigation, then start tour
    setTimeout(() => {
      startTour()
    }, 500)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRestartTour}>
      <RotateCcw className="h-4 w-4 mr-2" />
      Restart Tour
    </Button>
  )
}

