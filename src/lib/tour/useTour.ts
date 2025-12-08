'use client'

import { useState, useEffect, useCallback } from 'react'

const TOUR_STORAGE_KEY = 'washcall-onboarding-tour-completed'

export interface TourStep {
  id: string
  title: string
  description: string
  targetSelector?: string
  route?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FusionCaller!',
    description: 'Let us show you around. This quick tour will help you get started with managing your AI-powered phone system.',
    position: 'bottom',
  },
  {
    id: 'dashboard',
    title: 'Your Command Center',
    description: 'This is your dashboard. See your call stats, recent leads, and upcoming appointments at a glance.',
    targetSelector: '[data-tour="dashboard"]',
    route: '/app/dashboard',
    position: 'bottom',
  },
  {
    id: 'leads',
    title: 'Inbound Leads',
    description: 'All your inbound leads appear here. Click any lead to see their call recording, transcript, and details.',
    targetSelector: '[data-tour="leads"]',
    route: '/app/leads',
    position: 'right',
  },
  {
    id: 'campaigns',
    title: 'Outbound Campaigns',
    description: 'Create campaigns to proactively reach potential customers. Import contacts via CSV or add them manually.',
    targetSelector: '[data-tour="campaigns"]',
    route: '/app/campaigns',
    position: 'right',
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    description: 'Configure your business info, notification preferences, and manage your account settings here.',
    targetSelector: '[data-tour="settings"]',
    route: '/app/settings',
    position: 'right',
  },
  {
    id: 'help',
    title: 'Need Help?',
    description: 'Find answers to common questions and contact support anytime. We\'re here to help you succeed!',
    targetSelector: '[data-tour="help"]',
    route: '/app/help',
    position: 'right',
  },
]

export function useTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(true) // Default to true to prevent flash

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY)
      setHasCompleted(completed === 'true')
      
      // Auto-start tour for first-time users after a short delay
      if (completed !== 'true') {
        const timer = setTimeout(() => {
          setIsActive(true)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const startTour = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const endTour = useCallback((markComplete = true) => {
    setIsActive(false)
    setCurrentStep(0)
    if (markComplete && typeof window !== 'undefined') {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true')
      setHasCompleted(true)
    }
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      endTour(true)
    }
  }, [currentStep, endTour])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const skipTour = useCallback(() => {
    endTour(true)
  }, [endTour])

  const resetTour = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOUR_STORAGE_KEY)
      setHasCompleted(false)
    }
  }, [])

  return {
    isActive,
    currentStep,
    currentStepData: tourSteps[currentStep],
    totalSteps: tourSteps.length,
    hasCompleted,
    startTour,
    endTour,
    nextStep,
    prevStep,
    skipTour,
    resetTour,
  }
}

