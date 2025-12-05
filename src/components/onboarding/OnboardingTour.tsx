'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TourStep } from './TourStep'
import { useTour, tourSteps } from '@/lib/tour/useTour'

export function OnboardingTour() {
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
  } = useTour()

  const pathname = usePathname()
  const router = useRouter()

  // Handle navigation when tour step changes
  useEffect(() => {
    if (!isActive || !currentStepData?.route) return

    // Navigate to the step's route if not already there
    if (pathname !== currentStepData.route) {
      router.push(currentStepData.route)
    }
  }, [isActive, currentStepData, pathname, router])

  // Don't render if tour is not active
  if (!isActive) return null

  return (
    <TourStep
      title={currentStepData.title}
      description={currentStepData.description}
      targetSelector={currentStepData.targetSelector}
      position={currentStepData.position}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={skipTour}
      isFirst={currentStep === 0}
      isLast={currentStep === totalSteps - 1}
    />
  )
}

// Export a context provider for tour state
import { createContext, useContext, ReactNode } from 'react'

interface TourContextType {
  startTour: () => void
  resetTour: () => void
  hasCompleted: boolean
}

const TourContext = createContext<TourContextType | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
  const tour = useTour()

  return (
    <TourContext.Provider 
      value={{ 
        startTour: tour.startTour, 
        resetTour: tour.resetTour,
        hasCompleted: tour.hasCompleted,
      }}
    >
      {children}
      {tour.isActive && (
        <TourStep
          title={tour.currentStepData.title}
          description={tour.currentStepData.description}
          targetSelector={tour.currentStepData.targetSelector}
          position={tour.currentStepData.position}
          currentStep={tour.currentStep}
          totalSteps={tour.totalSteps}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
          isFirst={tour.currentStep === 0}
          isLast={tour.currentStep === tour.totalSteps - 1}
        />
      )}
    </TourContext.Provider>
  )
}

export function useTourContext() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTourContext must be used within a TourProvider')
  }
  return context
}

