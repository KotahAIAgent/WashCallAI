'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Clock, 
  Search, 
  Wrench, 
  TestTube, 
  CheckCircle2, 
  Zap,
  ArrowRight,
  Loader2
} from 'lucide-react'

type SetupStatus = 'pending' | 'in_review' | 'setting_up' | 'testing' | 'ready' | 'active'

interface SetupStatusBannerProps {
  status: SetupStatus
  hasPlan: boolean
}

const STATUS_CONFIG: Record<SetupStatus, {
  icon: React.ElementType
  title: string
  description: string
  color: string
  bgColor: string
  step: number
}> = {
  pending: {
    icon: Clock,
    title: 'Application Received',
    description: 'We\'ve received your application and will review it within 24 hours.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    step: 1,
  },
  in_review: {
    icon: Search,
    title: 'Under Review',
    description: 'Our team is reviewing your application and preparing your AI agent.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    step: 2,
  },
  setting_up: {
    icon: Wrench,
    title: 'Setting Up Your Agent',
    description: 'We\'re creating and customizing your AI agent based on your preferences.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    step: 3,
  },
  testing: {
    icon: TestTube,
    title: 'Testing',
    description: 'Your AI agent is being tested to ensure it sounds perfect for your business.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
    step: 4,
  },
  ready: {
    icon: CheckCircle2,
    title: 'Ready to Go Live!',
    description: 'Your AI agent is ready! Choose a plan to start receiving calls.',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    step: 5,
  },
  active: {
    icon: Zap,
    title: 'Active',
    description: 'Your AI agent is live and handling calls for your business.',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    step: 6,
  },
}

const STEPS = ['Received', 'Review', 'Setup', 'Testing', 'Ready']

export function SetupStatusBanner({ status, hasPlan }: SetupStatusBannerProps) {
  // If active and has plan, don't show banner
  if (status === 'active' && hasPlan) {
    return null
  }

  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Card className={`border ${config.bgColor} mb-6`}>
      <CardContent className="py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Status Info */}
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              {status === 'in_review' || status === 'setting_up' || status === 'testing' ? (
                <Loader2 className={`h-6 w-6 ${config.color} animate-spin`} />
              ) : (
                <Icon className={`h-6 w-6 ${config.color}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${config.color}`}>{config.title}</h3>
                <Badge variant="outline" className={config.color}>
                  Step {config.step} of 5
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
          </div>

          {/* CTA */}
          {status === 'ready' && !hasPlan && (
            <Link href="/app/pricing">
              <Button className="whitespace-nowrap">
                Choose a Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            {STEPS.map((stepName, index) => {
              const stepNum = index + 1
              const isCompleted = config.step > stepNum
              const isCurrent = config.step === stepNum
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? `${config.color} bg-white border-2 border-current`
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block ${
                      isCurrent ? 'font-medium text-gray-900' : 'text-gray-500'
                    }`}>
                      {stepName}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div 
                      className={`hidden sm:block w-12 lg:w-20 h-1 mx-2 rounded ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

