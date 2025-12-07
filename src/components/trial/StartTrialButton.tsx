'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { startFreeTrial } from '@/lib/trial/actions'
import { useRouter } from 'next/navigation'

interface StartTrialButtonProps {
  organizationId: string
  canStartTrial: boolean
  hasUsedTrial: boolean
  variant?: 'default' | 'large' | 'outline'
  trialPlan?: 'starter' | 'growth' | 'pro'
  planName?: string
}

export function StartTrialButton({ 
  organizationId, 
  canStartTrial, 
  hasUsedTrial,
  variant = 'default',
  trialPlan = 'starter',
  planName
}: StartTrialButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleStartTrial = async () => {
    setIsStarting(true)
    
    const result = await startFreeTrial(organizationId, trialPlan)
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
      setIsStarting(false)
      return
    }

    setIsSuccess(true)
    
    // Wait a moment to show success state
    setTimeout(() => {
      setIsDialogOpen(false)
      const planText = planName ? ` for ${planName}` : ''
      toast({
        title: '🎉 Welcome to NeverMiss AI!',
        description: `Your 7-day free trial${planText} has started. Enjoy full access to all features!`,
      })
      router.refresh()
    }, 1500)
  }

  if (hasUsedTrial) {
    return null // Don't show button if trial already used
  }

  if (!canStartTrial) {
    return null // Don't show if can't start trial
  }

  const buttonClasses = {
    default: '',
    large: 'h-12 px-8 text-lg',
    outline: 'border-2 border-primary bg-transparent hover:bg-primary/10',
  }

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        className={`${buttonClasses[variant]} bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700`}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        {planName ? `Start ${planName} Trial` : 'Start 7-Day Free Trial'}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          {isSuccess ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You're All Set! 🎉</h2>
              <p className="text-muted-foreground">
                Your 7-day free trial is now active. Enjoy!
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {planName ? `Start ${planName} Free Trial` : 'Start Your Free Trial'}
                </DialogTitle>
                <DialogDescription>
                  Get full access to Starter plan features (inbound calls only) for 7 days. No credit card required.
                  Upgrade to Growth or Pro for outbound calling features.
                </DialogDescription>
              </DialogHeader>

              <div className="py-6">
                {/* Trial Features */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    What's included:
                  </h4>
                  <ul className="space-y-2">
                    {[
                      'Unlimited inbound AI calls',
                      'Lead capture & management',
                      'Call recordings & transcripts',
                      'Appointment booking',
                      'SMS notifications',
                      'Analytics dashboard',
                      'Email support',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Note about outbound */}
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <strong>Note:</strong> Outbound calling features require a Growth or Pro subscription. 
                      Start with Starter to try inbound calls, then upgrade for outbound campaigns.
                    </p>
                  </div>
                </div>

                {/* No Credit Card Notice */}
                <div className="mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <strong>No credit card required</strong> — Start instantly
                  </p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Maybe Later
                </Button>
                <Button 
                  onClick={handleStartTrial} 
                  disabled={isStarting}
                  className="bg-gradient-to-r from-primary to-blue-600"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting Trial...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

