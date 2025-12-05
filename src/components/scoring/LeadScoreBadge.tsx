'use client'

import { TrendingUp, Flame, Thermometer, Snowflake } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface LeadScoreBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LeadScoreBadge({ score, showLabel = true, size = 'md' }: LeadScoreBadgeProps) {
  const getScoreInfo = (score: number) => {
    if (score >= 80) return { 
      label: 'Hot', 
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: Flame,
      description: 'High-value lead ready to convert'
    }
    if (score >= 60) return { 
      label: 'Warm', 
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: Thermometer,
      description: 'Engaged lead showing interest'
    }
    if (score >= 40) return { 
      label: 'Lukewarm', 
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Thermometer,
      description: 'Potential lead needs nurturing'
    }
    if (score >= 20) return { 
      label: 'Cool', 
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Snowflake,
      description: 'New lead, needs more engagement'
    }
    return { 
      label: 'Cold', 
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: Snowflake,
      description: 'Low engagement or not interested'
    }
  }

  const { label, color, icon: Icon, description } = getScoreInfo(score)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${color} ${sizeClasses[size]} font-medium cursor-help`}
          >
            <Icon className={`${iconSizes[size]} mr-1`} />
            {score}
            {showLabel && <span className="ml-1">({label})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{label} Lead</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <p className="text-xs mt-1">Score: {score}/100</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

